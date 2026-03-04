import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  RefreshCcw,
  MapPin,
  CreditCard,
  AlertTriangle,
  Download,
} from "lucide-react";

export const metadata: Metadata = { title: "Order Details" };

const TIMELINE = [
  { status: "PENDING",     label: "Order Placed",      icon: Clock        },
  { status: "CONFIRMED",   label: "Order Confirmed",   icon: CheckCircle2 },
  { status: "IN_PROGRESS", label: "Being Prepared",    icon: RefreshCcw   },
  { status: "SHIPPED",     label: "Shipped",           icon: Truck        },
  { status: "DELIVERED",   label: "Delivered",         icon: Package      },
  { status: "COMPLETED",   label: "Completed",         icon: CheckCircle2 },
];

const STATUS_ORDER = ["PENDING", "CONFIRMED", "IN_PROGRESS", "SHIPPED", "DELIVERED", "COMPLETED"];

const STATUS_BADGE: Record<string, string> = {
  PENDING:     "bg-yellow-100 text-yellow-700",
  CONFIRMED:   "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-indigo-100 text-indigo-700",
  SHIPPED:     "bg-purple-100 text-purple-700",
  DELIVERED:   "bg-green-100 text-green-700",
  COMPLETED:   "bg-green-100 text-green-700",
  CANCELLED:   "bg-red-100 text-red-600",
  REFUNDED:    "bg-gray-100 text-gray-600",
  DISPUTED:    "bg-orange-100 text-orange-700",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session   = await auth();
  const { id }    = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      product:  { select: { title: true, images: true, category: true, description: true } },
      gig:      { select: { title: true, category: true, description: true } },
      seller:   { select: { id: true, name: true, image: true, email: true } },
      conversation: { include: { messages: { orderBy: { createdAt: "asc" }, include: { sender: { select: { id: true, name: true } } } } } },
    },
  });

  if (!order || order.buyerId !== session!.user.id) notFound();

  const title     = order.product?.title ?? order.gig?.title ?? "Order";
  const category  = order.product?.category ?? order.gig?.category ?? "";
  const thumb     = order.product?.images?.[0];
  const desc      = order.product?.description ?? order.gig?.description ?? "";
  const statusIdx = STATUS_ORDER.indexOf(order.status);
  const isCancelled = ["CANCELLED", "REFUNDED", "DISPUTED"].includes(order.status);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl mx-auto space-y-6">

      {/* ── Back + Header ─────────────────────────────────── */}
      <div>
        <Link
          href="/dashboard/buyer/orders"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-gray-900">Order #{order.id.slice(-8).toUpperCase()}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <span className={cn("self-start sm:self-auto px-3 py-1.5 rounded-full text-xs font-bold", STATUS_BADGE[order.status])}>
            {order.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Left 2/3 ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Product / Gig card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4">
            <div className="w-20 h-20 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb} alt={title} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-8 h-8 text-gray-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 truncate">{title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{category}</p>
              {desc && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{desc}</p>}
              <div className="flex items-center gap-4 mt-3">
                <span className="text-xs text-gray-500">Qty: <strong>{order.quantity}</strong></span>
                <span className="text-xs text-gray-500">Total: <strong className="text-gray-900">${order.amount.toFixed(2)}</strong></span>
                <span className="text-xs text-gray-500">{order.type === "PRODUCT" ? "Physical Product" : "Digital Service"}</span>
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          {!isCancelled && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-5">
                Order Timeline
              </h3>
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-4 bottom-4 w-px bg-gray-100" />

                <div className="space-y-4">
                  {TIMELINE.map(({ status, label, icon: Icon }, i) => {
                    const done    = statusIdx >= i;
                    const current = statusIdx === i;
                    return (
                      <div key={status} className="flex items-start gap-4">
                        <div
                          className={cn(
                            "relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all",
                            done
                              ? current
                                ? "bg-primary-600 border-primary-600 shadow-md shadow-primary-200"
                                : "bg-primary-50 border-primary-200"
                              : "bg-white border-gray-200"
                          )}
                        >
                          <Icon className={cn("w-3.5 h-3.5", done ? current ? "text-white" : "text-primary-500" : "text-gray-300")} />
                        </div>
                        <div className="pt-1">
                          <p className={cn("text-sm font-semibold", done ? "text-gray-900" : "text-gray-400")}>
                            {label}
                          </p>
                          {current && (
                            <p className="text-xs text-primary-600 font-medium mt-0.5">Current status</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Cancelled banner */}
          {isCancelled && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700">Order {order.status.toLowerCase()}</p>
                <p className="text-xs text-red-500 mt-0.5">
                  This order was {order.status.toLowerCase()}. If you have questions, contact support.
                </p>
              </div>
            </div>
          )}

          {/* Messages section */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                Messages
              </h3>
              <span className="text-xs text-gray-400">
                {order.conversation?.messages.length ?? 0} messages
              </span>
            </div>

            {!order.conversation || order.conversation.messages.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <MessageSquare className="w-8 h-8 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">No messages yet</p>
                <p className="text-xs text-gray-400 mt-1">Contact the seller if you have questions</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {order.conversation.messages.map((msg) => {
                  const isMe = msg.senderId === session!.user.id;
                  return (
                    <div key={msg.id} className={cn("flex gap-2.5", isMe && "flex-row-reverse")}>
                      <div className={cn("w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white",
                        isMe ? "bg-primary-600" : "bg-gray-400"
                      )}>
                        {msg.sender.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className={cn("max-w-[75%] px-3 py-2 rounded-2xl text-sm",
                        isMe ? "bg-primary-600 text-white rounded-tr-sm" : "bg-gray-100 text-gray-800 rounded-tl-sm"
                      )}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Message input — client form */}
            <form className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              <input
                name="message"
                placeholder={`Message ${order.seller.name ?? "seller"}…`}
                className="flex-1 h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              />
              <button
                type="submit"
                className="px-4 h-9 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors flex-shrink-0"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        {/* ── Right column ───────────────────────────────── */}
        <div className="space-y-4">

          {/* Order summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
              Order Summary
            </h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold">${order.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Qty</span>
                <span className="font-semibold">{order.quantity}</span>
              </div>
              <div className="pt-2 border-t border-gray-100 flex justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-black text-gray-900">${order.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Seller info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">
              Seller
            </h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                {order.seller.name?.charAt(0).toUpperCase() ?? "S"}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{order.seller.name}</p>
                <p className="text-xs text-gray-400">{order.seller.email}</p>
              </div>
            </div>
            <button className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              <MessageSquare className="w-4 h-4" />
              Contact Seller
            </button>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">
              Actions
            </h3>
            <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-100 transition-colors">
              <Download className="w-4 h-4 text-gray-400" />
              Download Invoice
            </button>
            {order.status === "DELIVERED" && (
              <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-100 transition-colors">
                <CheckCircle2 className="w-4 h-4" />
                Mark as Completed
              </button>
            )}
            {["PENDING", "CONFIRMED"].includes(order.status) && (
              <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 border border-red-100 transition-colors">
                <XCircle className="w-4 h-4" />
                Cancel Order
              </button>
            )}
            {order.status === "COMPLETED" && (
              <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-100 transition-colors">
                <AlertTriangle className="w-4 h-4 text-gray-400" />
                Report Issue
              </button>
            )}
          </div>

          {/* Payment */}
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-gray-700">Payment Protected</p>
              <p className="text-xs text-gray-400">Exhubb Secure Checkout</p>
            </div>
          </div>

          {/* Delivery address placeholder */}
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-gray-700">Delivery Address</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                No address on file.{" "}
                <Link href="/dashboard/settings/profile" className="text-primary-600 hover:underline">
                  Add address →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
