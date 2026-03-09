"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendOrderShippedEmail } from "@/lib/email";

// ─── Phase 4: Seller Accept Order ────────────────────────────
export async function acceptOrderAction(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { sellerId: true, status: true, buyerId: true },
  });
  if (!order || order.sellerId !== session.user.id) return { error: "Unauthorized" };
  if (order.status !== "PENDING") return { error: "Order is not pending" };

  await prisma.order.update({ where: { id: orderId }, data: { status: "CONFIRMED" } });

  await prisma.notification.create({
    data: {
      userId: order.buyerId,
      type: "ORDER_CONFIRMED",
      title: "Your order has been confirmed!",
      body: "The seller has accepted your order and will ship it soon.",
      link: `/dashboard/buyer/orders/${orderId}`,
    },
  });

  revalidatePath(`/dashboard/seller/orders/${orderId}`);
  return { success: true };
}

// ─── Phase 4: Seller Cancel Order ────────────────────────────
export async function cancelOrderAction(orderId: string, reason?: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { sellerId: true, buyerId: true, status: true },
  });
  if (!order || order.sellerId !== session.user.id) return { error: "Unauthorized" };
  if (!["PENDING", "CONFIRMED"].includes(order.status)) return { error: "Cannot cancel at this stage" };

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED", notes: reason ? `Cancelled by seller: ${reason}` : undefined },
  });

  await prisma.notification.create({
    data: {
      userId: order.buyerId,
      type: "ORDER_CANCELLED",
      title: "Your order was cancelled",
      body: reason ?? "The seller has cancelled your order. A refund will be processed.",
      link: `/dashboard/buyer/orders/${orderId}`,
    },
  });

  revalidatePath(`/dashboard/seller/orders/${orderId}`);
  return { success: true };
}

// ─── Phase 5: Seller Mark as Shipped ─────────────────────────
export async function markShippedAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const orderId      = formData.get("orderId")      as string;
  const courierName  = formData.get("courierName")  as string;
  const trackingNumber = formData.get("trackingNumber") as string;
  const trackingUrl  = (formData.get("trackingUrl") as string) || null;
  const estimatedDays = formData.get("estimatedDays") ? parseInt(formData.get("estimatedDays") as string) : null;

  if (!orderId || !courierName || !trackingNumber) {
    return { error: "Courier name and tracking number are required" };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { sellerId: true, buyerId: true, status: true },
  });
  if (!order || order.sellerId !== session.user.id) return { error: "Unauthorized" };
  if (!["CONFIRMED", "IN_PROGRESS"].includes(order.status)) return { error: "Order is not ready to ship" };

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "SHIPPED",
      courierName,
      trackingNumber,
      trackingUrl,
      estimatedDays,
    },
  });

  await prisma.notification.create({
    data: {
      userId: order.buyerId,
      type: "ORDER_SHIPPED",
      title: "Your order has been shipped!",
      body: `Tracking: ${trackingNumber} via ${courierName}. ${estimatedDays ? `Estimated ${estimatedDays} days.` : ""}`,
      link: `/dashboard/buyer/orders/${orderId}`,
    },
  });

  // Send shipped email to buyer (fire-and-forget)
  try {
    const buyer = await prisma.user.findUnique({
      where:  { id: order.buyerId },
      select: { name: true, email: true },
    });
    if (buyer?.email) {
      void sendOrderShippedEmail(
        buyer.email,
        buyer.name ?? "",
        orderId,
        trackingNumber,
        courierName,
      ).catch(() => {});
    }
  } catch {
    // Email errors must not break order flow
  }

  revalidatePath(`/dashboard/seller/orders/${orderId}`);
  redirect(`/dashboard/seller/orders/${orderId}`);
}

// ─── Phase 7: Buyer Confirm Receipt ──────────────────────────
export async function confirmReceiptAction(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { buyerId: true, sellerId: true, status: true, amount: true },
  });
  if (!order || order.buyerId !== session.user.id) return { error: "Unauthorized" };
  if (!["SHIPPED", "DELIVERED"].includes(order.status)) return { error: "Order is not in a confirmable state" };

  const fee = order.amount * 0.05;
  const net = order.amount - fee;

  await prisma.$transaction([
    // Mark order completed
    prisma.order.update({ where: { id: orderId }, data: { status: "COMPLETED" } }),
    // Credit seller wallet
    prisma.user.update({ where: { id: order.sellerId }, data: { walletBalance: { increment: net } } }),
    // Log wallet transaction
    prisma.walletTransaction.create({
      data: {
        userId: order.sellerId,
        type: "SALE_CREDIT",
        amount: net,
        description: `Sale completed — Order #${orderId.slice(-8).toUpperCase()}`,
        reference: orderId,
        status: "COMPLETED",
      },
    }),
    // Fee transaction
    prisma.walletTransaction.create({
      data: {
        userId: order.sellerId,
        type: "FEE",
        amount: fee,
        description: `Platform fee (5%) — Order #${orderId.slice(-8).toUpperCase()}`,
        reference: orderId,
        status: "COMPLETED",
      },
    }),
    // Notify seller
    prisma.notification.create({
      data: {
        userId: order.sellerId,
        type: "ORDER_COMPLETED",
        title: "Order completed — payment released!",
        body: `₦${net.toLocaleString()} has been credited to your wallet.`,
        link: `/dashboard/seller/orders/${orderId}`,
      },
    }),
  ]);

  revalidatePath(`/dashboard/buyer/orders/${orderId}`);
  return { success: true };
}

// ─── Phase 7: Auto-complete orders older than 7 days ─────────
// Call this on relevant page loads as a lightweight check
export async function autoCompleteStaleOrders(sellerId: string) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const stale = await prisma.order.findMany({
    where: {
      sellerId,
      status: { in: ["SHIPPED", "DELIVERED"] },
      updatedAt: { lte: sevenDaysAgo },
    },
    select: { id: true, amount: true, sellerId: true, buyerId: true },
  });

  for (const order of stale) {
    const fee = order.amount * 0.05;
    const net = order.amount - fee;
    await prisma.$transaction([
      prisma.order.update({ where: { id: order.id }, data: { status: "COMPLETED" } }),
      prisma.user.update({ where: { id: order.sellerId }, data: { walletBalance: { increment: net } } }),
      prisma.walletTransaction.create({
        data: {
          userId: order.sellerId,
          type: "SALE_CREDIT",
          amount: net,
          description: `Auto-completed — Order #${order.id.slice(-8).toUpperCase()}`,
          reference: order.id,
          status: "COMPLETED",
        },
      }),
      prisma.notification.create({
        data: {
          userId: order.sellerId,
          type: "ORDER_COMPLETED",
          title: "Order auto-completed",
          body: `₦${net.toLocaleString()} credited after 7-day auto-release.`,
          link: `/dashboard/seller/orders/${order.id}`,
        },
      }),
    ]);
  }
}

// ─── Phase 8: Buyer Open Dispute ─────────────────────────────
export async function openDisputeAction(orderId: string, reason: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { buyerId: true, sellerId: true, status: true },
  });
  if (!order || order.buyerId !== session.user.id) return { error: "Unauthorized" };
  if (!["SHIPPED", "DELIVERED", "COMPLETED"].includes(order.status)) {
    return { error: "Cannot dispute this order at its current stage" };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "DISPUTED", notes: `Dispute: ${reason}` },
  });

  // Notify seller
  await prisma.notification.create({
    data: {
      userId: order.sellerId,
      type: "ORDER_DISPUTED",
      title: "A buyer has opened a dispute",
      body: reason,
      link: `/dashboard/seller/orders/${orderId}`,
    },
  });

  revalidatePath(`/dashboard/buyer/orders/${orderId}`);
  return { success: true };
}

// ─── Phase 9: Request Withdrawal ─────────────────────────────
export async function requestWithdrawalAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const amount = parseFloat(formData.get("amount") as string);
  if (isNaN(amount) || amount < 5000) return { error: "Minimum withdrawal is ₦5,000" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { walletBalance: true, bankName: true, bankAccountNumber: true, bankAccountName: true },
  });
  if (!user) return { error: "User not found" };
  if (!user.bankAccountNumber) return { error: "Please add your bank details before withdrawing" };
  if (user.walletBalance < amount) return { error: "Insufficient wallet balance" };

  // Deduct balance + log pending payout
  await prisma.$transaction([
    prisma.user.update({ where: { id: session.user.id }, data: { walletBalance: { decrement: amount } } }),
    prisma.walletTransaction.create({
      data: {
        userId: session.user.id,
        type: "PAYOUT",
        amount,
        description: `Withdrawal to ${user.bankName} ••••${user.bankAccountNumber.slice(-4)}`,
        status: "PENDING",
      },
    }),
    prisma.notification.create({
      data: {
        userId: session.user.id,
        type: "PAYOUT_SENT",
        title: "Withdrawal request received",
        body: `₦${amount.toLocaleString()} will be transferred within 1 business day.`,
        link: "/dashboard/seller/earnings",
      },
    }),
  ]);

  revalidatePath("/dashboard/seller/earnings");
  return { success: true };
}

// ─── Phase 8: Submit Review ───────────────────────────────────
export async function submitReviewAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const productId = formData.get("productId") as string;
  const orderId   = formData.get("orderId")   as string;
  const rating    = parseInt(formData.get("rating") as string);
  const comment   = (formData.get("comment") as string)?.trim() || null;

  if (!productId || isNaN(rating) || rating < 1 || rating > 5) {
    return { error: "Invalid review data" };
  }

  // Verify buyer purchased this product
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { buyerId: true, status: true, productId: true, sellerId: true },
  });
  if (!order || order.buyerId !== session.user.id) return { error: "Unauthorized" };
  if (!(["DELIVERED", "COMPLETED"] as string[]).includes(order.status)) return { error: "You can only review orders you have received" };
  if (order.productId !== productId)  return { error: "Product mismatch" };

  const review = await prisma.review.upsert({
    where: { productId_reviewerId: { productId, reviewerId: session.user.id } },
    create: { productId, reviewerId: session.user.id, rating, comment },
    update: { rating, comment },
  });

  // Notify seller
  await prisma.notification.create({
    data: {
      userId: order.sellerId,
      type: "REVIEW_RECEIVED",
      title: `New ${rating}★ review`,
      body: comment ?? "A buyer left a rating on your product.",
      link: `/dashboard/seller/orders/${orderId}`,
    },
  });

  revalidatePath(`/dashboard/buyer/orders/${orderId}`);
  revalidatePath(`/products/${productId}`);
  return { success: true, reviewId: review.id };
}

// ─── Legacy: generic status update (seller side) ─────────────
export async function updateOrderStatusAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;

  const orderId = formData.get("orderId") as string;
  const status  = formData.get("status")  as string;
  const role    = (formData.get("role") as string) ?? "seller";

  const allowed = ["CONFIRMED", "IN_PROGRESS", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED"];
  if (!orderId || !allowed.includes(status)) return;

  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { sellerId: true } });
  if (!order || order.sellerId !== session.user.id) return;

  await prisma.order.update({ where: { id: orderId }, data: { status: status as never } });
  redirect(`/dashboard/${role}/orders/${orderId}`);
}

// ─── Refund: Buyer requests a refund ─────────────────────────
export async function requestRefundAction(orderId: string, reason: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  if (!reason?.trim()) return { error: "Please provide a reason for the refund" };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { buyerId: true, sellerId: true, status: true, refundStatus: true },
  });

  if (!order || order.buyerId !== session.user.id) return { error: "Unauthorized" };
  if (!["DELIVERED", "COMPLETED", "SHIPPED"].includes(order.status)) {
    return { error: "Refunds can only be requested on delivered or completed orders" };
  }
  if (order.refundStatus === "REQUESTED" || order.refundStatus === "APPROVED") {
    return { error: "A refund request already exists for this order" };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { refundStatus: "REQUESTED", refundReason: reason },
  });

  await prisma.notification.create({
    data: {
      userId: order.sellerId,
      type: "ORDER_DISPUTED",
      title: "Refund request received",
      body: `A buyer has requested a refund: "${reason.slice(0, 100)}"`,
      link: `/dashboard/seller/orders/${orderId}`,
    },
  });

  revalidatePath(`/dashboard/buyer/orders/${orderId}`);
  return { success: true };
}

// ─── Refund: Seller approves or rejects ──────────────────────
export async function processRefundAction(orderId: string, approve: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { sellerId: true, buyerId: true, amount: true, refundStatus: true },
  });

  if (!order || order.sellerId !== session.user.id) return { error: "Unauthorized" };
  if (order.refundStatus !== "REQUESTED") return { error: "No pending refund request for this order" };

  if (approve) {
    // Debit seller wallet & credit buyer wallet
    const refundAmount = order.amount;
    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { refundStatus: "APPROVED", status: "REFUNDED", refundedAt: new Date(), paymentStatus: "REFUNDED" },
      }),
      // Debit seller
      prisma.user.update({ where: { id: order.sellerId }, data: { walletBalance: { decrement: refundAmount } } }),
      prisma.walletTransaction.create({
        data: {
          userId: order.sellerId,
          type: "REFUND",
          amount: refundAmount,
          description: `Refund approved — Order #${orderId.slice(-8).toUpperCase()}`,
          reference: orderId,
          status: "COMPLETED",
        },
      }),
      // Credit buyer
      prisma.user.update({ where: { id: order.buyerId }, data: { walletBalance: { increment: refundAmount } } }),
      prisma.walletTransaction.create({
        data: {
          userId: order.buyerId,
          type: "REFUND",
          amount: refundAmount,
          description: `Refund received — Order #${orderId.slice(-8).toUpperCase()}`,
          reference: orderId,
          status: "COMPLETED",
        },
      }),
      prisma.notification.create({
        data: {
          userId: order.buyerId,
          type: "ORDER_CANCELLED",
          title: "Refund approved!",
          body: `₦${refundAmount.toLocaleString()} has been added to your wallet.`,
          link: `/dashboard/buyer/orders/${orderId}`,
        },
      }),
    ]);
  } else {
    await prisma.order.update({
      where: { id: orderId },
      data: { refundStatus: "REJECTED" },
    });

    await prisma.notification.create({
      data: {
        userId: order.buyerId,
        type: "ORDER_CANCELLED",
        title: "Refund request rejected",
        body: "The seller has reviewed your refund request and decided not to approve it. You may open a dispute.",
        link: `/dashboard/buyer/orders/${orderId}`,
      },
    });
  }

  revalidatePath(`/dashboard/seller/orders/${orderId}`);
  return { success: true };
}

