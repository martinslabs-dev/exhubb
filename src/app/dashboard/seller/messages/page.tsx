import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { sendMessageAction } from "@/lib/actions/messages";
import {
  MessageSquare,
  Search,
  Package,
  Circle,
  Send,
} from "lucide-react";

export const metadata: Metadata = { title: "Messages" };

export default async function SellerMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conv?: string }>;
}) {
  const session  = await auth();
  const params   = await searchParams;
  const activeId = params.conv;

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { buyerId:  session!.user.id },
        { sellerId: session!.user.id },
      ],
    },
    include: {
      buyer:  { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      order:  { select: { id: true, gigId: true, product: { select: { title: true } }, gig: { select: { title: true } } } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const active = conversations.find((c) => c.id === activeId);
  const activeMessages = active
    ? await prisma.message.findMany({
        where:   { conversationId: active.id },
        include: { sender: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      })
    : [];

  // Mark unread messages as read for the active conversation
  if (active) {
    await prisma.message.updateMany({
      where: {
        conversationId: active.id,
        senderId:       { not: session!.user.id },
        isRead:         false,
      },
      data: { isRead: true },
    });
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">

      {/* ── Conversation list ─────────────────────────────── */}
      <div className={cn(
        "flex flex-col border-r border-gray-200 bg-white",
        "w-full md:w-72 lg:w-80 flex-shrink-0",
        activeId ? "hidden md:flex" : "flex",
      )}>
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Messages</h2>
          <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 focus-within:border-gray-400 focus-within:bg-white">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              placeholder="Search conversations…"
              className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
              <MessageSquare className="w-8 h-8 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500 mb-1">No conversations yet</p>
              <p className="text-xs text-gray-400 mb-4">
                Messages from buyers will appear here once you receive orders.
              </p>
              <Link
                href="/dashboard/seller/orders"
                className="text-xs font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <Package className="w-3 h-3" />
                View Orders
              </Link>
            </div>
          ) : (
            conversations.map((conv) => {
              const other      = conv.sellerId === session!.user.id ? conv.buyer : conv.seller;
              const lastMsg    = conv.messages[0];
              const orderTitle = conv.order?.product?.title ?? conv.order?.gig?.title ?? "Order";
              const isActive   = conv.id === activeId;
              const hasUnread  = lastMsg && !lastMsg.isRead && lastMsg.senderId !== session!.user.id;

              return (
                <Link
                  key={conv.id}
                  href={`/dashboard/seller/messages?conv=${conv.id}`}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50",
                    isActive && "bg-gray-50 border-gray-200",
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white",
                      isActive ? "bg-gray-700" : "bg-gray-400",
                    )}>
                      {other.name?.charAt(0).toUpperCase()}
                    </div>
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gray-700 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={cn("text-sm truncate", hasUnread ? "font-semibold text-gray-900" : "text-gray-700")}>
                        {other.name}
                      </p>
                      {lastMsg && (
                        <p className="text-[10px] text-gray-400 flex-shrink-0 ml-1">
                          {new Date(lastMsg.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{orderTitle}</p>
                    {lastMsg && (
                      <p className={cn("text-xs truncate mt-0.5", hasUnread ? "text-gray-700 font-medium" : "text-gray-400")}>
                        {lastMsg.senderId === session!.user.id ? "You: " : ""}{lastMsg.content}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* ── Message thread ───────────────────────────────── */}
      <div className={cn(
        "flex-1 flex flex-col bg-white min-w-0",
        !activeId && "hidden md:flex",
      )}>
        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <MessageSquare className="w-10 h-10 text-gray-200 mb-4" />
            <p className="text-sm font-medium text-gray-500 mb-1">Select a conversation</p>
            <p className="text-xs text-gray-400 max-w-xs">
              Choose a conversation from the list to view messages.
            </p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="h-14 px-5 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
              <Link
                href="/dashboard/seller/messages"
                className="p-1.5 rounded-lg hover:bg-gray-100 md:hidden"
              >
                ←
              </Link>
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {(active.sellerId === session!.user.id ? active.buyer : active.seller).name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {(active.sellerId === session!.user.id ? active.buyer : active.seller).name}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Circle className="w-2 h-2 fill-green-400 text-green-400" />
                  Online
                </p>
              </div>
              {active.order && (
                <Link
                  href={
                    active.order.gigId
                      ? `/dashboard/freelancer/orders/${active.order.id}`
                      : `/dashboard/seller/orders/${active.order.id}`
                  }
                  className="ml-auto text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 bg-gray-50 px-3 py-1.5 rounded-lg"
                >
                  View Order
                </Link>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {activeMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-sm text-gray-400">No messages yet. Start the conversation.</p>
                </div>
              ) : (
                activeMessages.map((msg) => {
                  const isMe = msg.senderId === session!.user.id;
                  return (
                    <div key={msg.id} className={cn("flex gap-2.5", isMe && "flex-row-reverse")}>
                      <div className={cn(
                        "w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold text-white",
                        isMe ? "bg-gray-700" : "bg-gray-400",
                      )}>
                        {msg.sender.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className={cn(
                        "max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                        isMe
                          ? "bg-gray-900 text-white rounded-tr-sm"
                          : "bg-gray-100 text-gray-800 rounded-tl-sm",
                      )}>
                        {msg.content}
                        <p className={cn("text-[10px] mt-1", isMe ? "text-gray-400" : "text-gray-400")}>
                          {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input */}
            <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
              <form action={sendMessageAction} className="flex items-center gap-2">
                <input type="hidden" name="conversationId" value={active.id} />
                <input
                  name="message"
                  placeholder="Type a message…"
                  className="flex-1 h-10 px-4 rounded-lg border border-gray-200 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />
                <button
                  type="submit"
                  className="w-10 h-10 rounded-lg bg-gray-900 hover:bg-gray-700 text-white flex items-center justify-center flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
