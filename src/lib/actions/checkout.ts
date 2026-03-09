"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getEtaForZone } from "@/lib/checkout-utils";
import crypto from "crypto";
import { sendOrderConfirmationEmail, sendSellerNewOrderEmail } from "@/lib/email";

// Zone detection based on country code
function detectZone(country: string): "NIGERIA" | "AFRICA" | "INTERNATIONAL" {
  if (country === "NG") return "NIGERIA";
  const africaCodes = [
    "DZ","AO","BJ","BW","BF","BI","CV","CM","CF","TD","KM","CG","CD","CI","DJ","EG",
    "GQ","ER","SZ","ET","GA","GM","GH","GN","GW","KE","LS","LR","LY","MG","MW","ML",
    "MR","MU","MA","MZ","NA","NE","RW","ST","SN","SL","SO","ZA","SS","SD","TZ","TG",
    "TN","UG","ZM","ZW",
  ];
  if (africaCodes.includes(country)) return "AFRICA";
  return "INTERNATIONAL";
}

// Flat shipping fees per zone (NGN) — seller override takes priority
function getShippingFee(
  zone: "NIGERIA" | "AFRICA" | "INTERNATIONAL",
  productFees: { nigeriaFee?: number | null; africaFee?: number | null; internationalFee?: number | null }
): number {
  if (zone === "NIGERIA")       return productFees.nigeriaFee       ?? 2000;
  if (zone === "AFRICA")        return productFees.africaFee        ?? 8000;
  if (zone === "INTERNATIONAL") return productFees.internationalFee ?? 20000;
  return 0;
}

// ─── Place Order ──────────────────────────────────────────────
export async function placeOrderAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const shippingName    = formData.get("shippingName")    as string;
  const shippingPhone   = formData.get("shippingPhone")   as string;
  const shippingAddress = formData.get("shippingAddress") as string;
  const shippingCity    = formData.get("shippingCity")    as string;
  const shippingState   = formData.get("shippingState")   as string;
  const shippingCountry = (formData.get("shippingCountry") as string) || "NG";
  const courierName     = formData.get("courierName")     as string;
  const discountCodeId  = (formData.get("discountCodeId")  as string) || null;
  const discountAmount  = discountCodeId ? parseFloat(formData.get("discountAmount") as string) || 0 : 0;

  // Load cart with productType
  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true, title: true, price: true, sellerId: true, stock: true,
              shippingZones: true, nigeriaFee: true, africaFee: true, internationalFee: true,
              productType: true,
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) return { error: "Cart is empty" };

  const allDigital = cart.items.every((i) => i.product.productType === "DIGITAL");

  if (!allDigital) {
    // Physical order requires shipping details
    if (!shippingName || !shippingPhone || !shippingAddress || !shippingCity || !shippingCountry || !courierName) {
      return { error: "Please fill in all required shipping fields" };
    }
  }

  const zone = allDigital ? ("NIGERIA" as const) : detectZone(shippingCountry);

  if (!allDigital) {
    // Validate shipping zone + stock for physical items
    for (const item of cart.items) {
      if (item.product.productType === "PHYSICAL" && !item.product.shippingZones.includes(zone)) {
        return { error: `One or more items do not ship to ${zone.toLowerCase().replace("_", " ")}` };
      }
      if (item.product.stock < item.quantity) {
        return { error: "Some items are out of stock. Please update your cart." };
      }
    }
  }

  // Create one order per seller
  const orderIds: string[] = [];
  const sellerGroups = cart.items.reduce<Record<string, typeof cart.items>>((acc, item) => {
    const sid = item.product.sellerId;
    if (!acc[sid]) acc[sid] = [];
    acc[sid].push(item);
    return acc;
  }, {});

  for (const [sellerId, sellerItems] of Object.entries(sellerGroups)) {
    const shippingFee = allDigital ? 0 : getShippingFee(zone, sellerItems[0].product);
    const eta = allDigital ? { days: 0 } : getEtaForZone(zone, courierName);

    for (const item of sellerItems) {
      const isDigitalItem = item.product.productType === "DIGITAL";
      const itemFee = sellerItems.length === 1 ? shippingFee : 0;

      const order = await prisma.order.create({
        data: {
          buyerId: session.user.id,
          sellerId,
          productId: item.product.id,
          type: "PRODUCT",
          status: isDigitalItem ? "CONFIRMED" : "PENDING",
          amount: Math.max(0,
            item.product.price * item.quantity
            + (item === sellerItems[0] ? shippingFee : 0)
            + item.product.price * item.quantity * 0.05
            - (item === sellerItems[0] ? discountAmount : 0)
          ),
          quantity: item.quantity,
          discountCodeId: item === sellerItems[0] ? discountCodeId : null,
          discountAmount: item === sellerItems[0] ? discountAmount : null,
          shippingName:    isDigitalItem ? null : shippingName,
          shippingPhone:   isDigitalItem ? null : shippingPhone,
          shippingAddress: isDigitalItem ? null : shippingAddress,
          shippingCity:    isDigitalItem ? null : shippingCity,
          shippingState:   isDigitalItem ? null : shippingState,
          shippingCountry: isDigitalItem ? null : shippingCountry,
          shippingZone: zone,
          shippingFee: item === sellerItems[0] ? itemFee : 0,
          courierName: isDigitalItem ? null : courierName,
          estimatedDays: eta.days,
          downloadToken: isDigitalItem ? crypto.randomUUID() : null,
        },
      });
      orderIds.push(order.id);

      // Decrement stock only for physical
      if (!isDigitalItem) {
        await prisma.product.update({
          where: { id: item.product.id },
          data:  { stock: { decrement: item.quantity } },
        });
      }
    }
  }

  // Clear cart
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  // Increment discount code usage count
  if (discountCodeId) {
    await prisma.discountCode.update({
      where: { id: discountCodeId },
      data:  { usedCount: { increment: 1 } },
    });
  }

  // Notify sellers
  for (const [sellerId] of Object.entries(sellerGroups)) {
    await prisma.notification.create({
      data: {
        userId: sellerId,
        type: "ORDER_PLACED",
        title: "New Order Received!",
        body: allDigital
          ? "You have a new digital product order — no shipping required."
          : "You have a new order waiting for confirmation.",
        link: `/dashboard/seller/orders`,
      },
    });
  }

  // ── Send email notifications (fire-and-forget) ──────────────
  try {
    const buyer = await prisma.user.findUnique({
      where:  { id: session.user.id },
      select: { name: true, email: true },
    });

    if (buyer?.email) {
      const emailItems = cart.items.map((i) => ({
        title: i.product.title,
        qty:   i.quantity,
        price: i.product.price,
      }));
      const total = orderIds.length > 0
        ? cart.items.reduce(
            (s, i) => s + i.product.price * i.quantity,
            0,
          )
        : 0;
      void sendOrderConfirmationEmail(
        buyer.email,
        buyer.name ?? "",
        orderIds[0],
        emailItems,
        total,
      ).catch(() => {});
    }

    const sellerIds = Object.keys(sellerGroups);
    const sellers = await prisma.user.findMany({
      where:  { id: { in: sellerIds } },
      select: { id: true, name: true, email: true },
    });
    for (const seller of sellers) {
      if (!seller.email) continue;
      const items = sellerGroups[seller.id];
      const firstItem = items[0];
      void sendSellerNewOrderEmail(
        seller.email,
        seller.name ?? "",
        orderIds[sellerIds.indexOf(seller.id)] ?? orderIds[0],
        firstItem.product.title,
        firstItem.product.price * firstItem.quantity,
      ).catch(() => {});
    }
  } catch {
    // Email errors must not break order placement
  }

  return { success: true, orderIds };
}

