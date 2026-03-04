import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Search,
  ShoppingBag,
  Circle,
  Send,
} from "lucide-react";

export const metadata: Metadata = { title: "Messages" };

export default async function BuyerMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conv?: string }>;
}) {
  const session   = await auth();
  const params    = await searchParams;
  const activeId  = params.conv;

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
      order:  { select: { id: true, product: { select: { title: true } }, gig: { select: { title: true } } } },
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
        where: { conversationId: active.id },
        include: { sender: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      })
    : [];

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">

      {/* ── Conversation list ─────────────────────────────── */}
      <div className={cn(
        "flex flex-col border-r border-gray-100 bg-white",
        "w-full md:w-72 lg:w-80 flex-shrink-0",
        activeId ? "hidden md:flex" : "flex"
      )}>
        {/* List header */}
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-base font-black text-gray-900 mb-3">Messages</h2>
          <div className="flex items-center gap-2 h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 focus-within:border-primary-400 focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              placeholder="Search conversations…"
              className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-gray-200" />
              </div>
              <p className="text-sm font-semibold text-gray-500 mb-1">No conversations yet</p>
              <p className="text-xs text-gray-400 mb-4">
                Messages from sellers will appear here.
              </p>
              <Link
                href="/"
                className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <ShoppingBag className="w-3 h-3" />
                Start Shopping
              </Link>
            </div>
          ) : (
            conversations.map((conv) => {
              const other      = conv.buyerId === session!.user.id ? conv.seller : conv.buyer;
              const lastMsg    = conv.messages[0];
              const orderTitle = conv.order?.product?.title ?? conv.order?.gig?.title ?? "Order";
              const isActive   = conv.id === activeId;
              const hasUnread  = lastMsg && !lastMsg.isRead && lastMsg.senderId !== session!.user.id;

              return (
                <Link
                  key={conv.id}
                  href={`/dashboard/buyer/messages?conv=${conv.id}`}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors",
                    isActive && "bg-primary-50 hover:bg-primary-50 border-primary-100"
                  )}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white",
                      isActive ? "bg-primary-600" : "bg-gray-400"
                    )}>
                      {other.name?.charAt(0).toUpperCase()}
                    </div>
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary-600 rounded-full border-2 border-white" />
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={cn("text-sm truncate", hasUnread ? "font-bold text-gray-900" : "font-semibold text-gray-700")}>
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
        !activeId && "hidden md:flex"
      )}>
        {!active ? (
          /* No conversation selected — desktop placeholder */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
              <MessageSquare className="w-9 h-9 text-gray-200" />
            </div>
            <p className="text-base font-bold text-gray-600 mb-1">Select a conversation</p>
            <p className="text-sm text-gray-400 max-w-xs">
              Choose a conversation from the list to view messages.
            </p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="h-16 px-5 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
              <Link
                href="/dashboard/buyer/messages"
                className="p-1.5 rounded-lg hover:bg-gray-100 md:hidden transition-colors"
              >
                ←
              </Link>
              <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                {(active.buyerId === session!.user.id ? active.seller : active.buyer).name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {(active.buyerId === session!.user.id ? active.seller : active.buyer).name}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Circle className="w-2 h-2 fill-green-400 text-green-400" />
                  Active now
                </p>
              </div>
              {active.order && (
                <Link
                  href={`/dashboard/buyer/orders/${active.order.id}`}
                  className="ml-auto text-xs font-semibold text-primary-600 hover:text-primary-700 border border-primary-100 bg-primary-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  View Order
                </Link>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {activeMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-sm text-gray-400">No messages yet. Say hello! 👋</p>
                </div>
              ) : (
                activeMessages.map((msg) => {
                  const isMe = msg.senderId === session!.user.id;
                  return (
                    <div key={msg.id} className={cn("flex gap-2.5", isMe && "flex-row-reverse")}>
                      <div className={cn("w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black text-white",
                        isMe ? "bg-primary-600" : "bg-gray-400"
                      )}>
                        {msg.sender.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className={cn("max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                        isMe
                          ? "bg-primary-600 text-white rounded-tr-sm"
                          : "bg-gray-100 text-gray-800 rounded-tl-sm"
                      )}>
                        {msg.content}
                        <p className={cn("text-[10px] mt-1", isMe ? "text-primary-200" : "text-gray-400")}>
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
              <form className="flex items-center gap-2">
                <input
                  name="message"
                  placeholder="Type a message…"
                  className="flex-1 h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                />
                <button
                  type="submit"
                  className="w-11 h-11 rounded-xl bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center flex-shrink-0 transition-colors"
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
