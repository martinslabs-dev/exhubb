"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Send a message to an existing conversation.
 * Used by the dedicated messages pages (/dashboard/[role]/messages).
 */
export async function sendMessageAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;

  const conversationId = (formData.get("conversationId") as string | null)?.trim();
  const content        = (formData.get("message")        as string | null)?.trim();

  if (!conversationId || !content) return;

  // Verify the sender is a participant in this conversation
  const conv = await prisma.conversation.findUnique({
    where:  { id: conversationId },
    select: { buyerId: true, sellerId: true },
  });

  if (!conv) return;
  if (conv.buyerId !== session.user.id && conv.sellerId !== session.user.id) return;

  await prisma.message.create({
    data: { conversationId, senderId: session.user.id, content },
  });

  revalidatePath("/dashboard/buyer/messages");
  revalidatePath("/dashboard/seller/messages");
  revalidatePath("/dashboard/freelancer/messages");
}

/**
 * Send a message from an order detail page.
 * Creates the conversation automatically if it does not yet exist.
 * Used by /dashboard/buyer/orders/[id] and /dashboard/seller/orders/[id].
 */
export async function sendOrderMessageAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;

  const orderId = (formData.get("orderId") as string | null)?.trim();
  const content = (formData.get("message") as string | null)?.trim();

  if (!orderId || !content) return;

  const order = await prisma.order.findUnique({
    where:  { id: orderId },
    select: { buyerId: true, sellerId: true, conversation: { select: { id: true } } },
  });

  if (!order) return;
  if (order.buyerId !== session.user.id && order.sellerId !== session.user.id) return;

  // Create the conversation on first message if it doesn't exist yet
  let conversationId = order.conversation?.id;
  if (!conversationId) {
    const conv = await prisma.conversation.create({
      data: { orderId, buyerId: order.buyerId, sellerId: order.sellerId },
    });
    conversationId = conv.id;
  }

  await prisma.message.create({
    data: { conversationId, senderId: session.user.id, content },
  });

  revalidatePath(`/dashboard/buyer/orders/${orderId}`);
  revalidatePath(`/dashboard/seller/orders/${orderId}`);
  revalidatePath(`/dashboard/freelancer/orders/${orderId}`);
}
