import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { autoCompleteStaleOrders } from "@/lib/actions/orders";
import SellerOrderActions from "./SellerOrderActions";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  RefreshCcw,
  ArrowLeft,
  User2,
  MessageSquare,
  Calendar,
  Hash,
  ShoppingBag,
  AlertTriangle,
  MapPin,
  ExternalLink,
} from "lucide-react";

export const metadata: Metadata = { title: "Order Details — Seller" };

const STATUS_CONFIG = {
  PENDING:     { label: "Pending",     color: "bg-yellow-100 text-yellow-700",  icon: Clock        },
  CONFIRMED:   { label: "Confirmed",   color: "bg-blue-100 text-blue-700",      icon: CheckCircle2 },
  IN_PROGRESS: { label: "In Progress", color: "bg-indigo-100 text-indigo-700",  icon: RefreshCcw   },
  SHIPPED:     { label: "Shipped",     color: "bg-purple-100 text-purple-700",  icon: Truck        },
  DELIVERED:   { label: "Delivered",   color: "bg-green-100 text-green-700",    icon: Package      },
  COMPLETED:   { label: "Completed",   color: "bg-green-100 text-green-700",    icon: CheckCircle2 },
  CANCELLED:   { label: "Cancelled",   color: "bg-red-100 text-red-600",        icon: XCircle      },
  REFUNDED:    { label: "Refunded",    color: "bg-gray-100 text-gray-600",      icon: RefreshCcw   },
  DISPUTED:    { label: "Disputed",    color: "bg-orange-100 text-orange-700",  icon: AlertTriangle},
} as const;

const TIMELINE: { status: keyof typeof STATUS_CONFIG; label: string }[] = [
  { status: "PENDING",   label: "Order Placed" },
  { status: "CONFIRMED", label: "Confirmed"    },
  { status: "SHIPPED",   label: "Shipped"      },
  { status: "DELIVERED", label: "Delivered"    },
  { status: "COMPLETED", label: "Completed"    },
];

const STATUS_RANK: Record<string, number> = {
  PENDING: 0, CONFIRMED: 1, IN_PROGRESS: 1.5, SHIPPED: 2, DELIVERED: 3, COMPLETED: 4,
};

export default async function SellerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { id } = await params;

  // Auto-complete stale shipped orders for this seller
  await autoCompleteStaleOrders(session.user.id);

  const order = await prisma.order.findUnique({
    where:   { id },
    include: {
      product:      { select: { title: true, images: true, category: true, price: true } },
      gig:          { select: { title: true, category: true, basicPrice: true } },
      buyer:        { select: { name: true, email: true, image: true, createdAt: true } },
      conversation: { select: { id: true } },
    },
  });

  if (!order || order.sellerId !== session.user.id) notFound();

  const cfg         = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING;
  const StatusIcon  = cfg.icon;
  const title       = order.product?.title ?? order.gig?.title ?? "Order";
  const thumb       = order.product?.images?.[0] ?? null;
  const category    = order.product?.category ?? order.gig?.category ?? null;
  const feeRate     = 0.05;
  const fee         = order.amount * feeRate;
  const net         = order.amount - fee;
  const currentRank = STATUS_RANK[order.status] ?? -1;
  const isFinal     = ["COMPLETED", "CANCELLED", "REFUNDED", "DISPUTED"].includes(order.status);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl mx-auto space-y-6">

      {/* ── Back + Header ─────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <Link
          href="/dashboard/seller/orders"
          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center flex-shrink-0 transition-colors mt-0.5"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black text-gray-900 truncate">{title}</h1>
            <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full", cfg.color)}>
              <StatusIcon className="w-3 h-3" />
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
            <span className="flex items-center gap-1">
              <Hash className="w-3 h-3" />
              {order.id.slice(-12).toUpperCase()}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
            {category && (
              <span className="bg-gray-100 px-2 py-0.5 rounded-full">{category}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left col (2/3) ────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Product / Gig card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
              {order.type === "PRODUCT" ? "Product" : "Service"}
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {thumb
                  ? <img src={thumb} alt={title} className="w-full h-full object-cover" /> // eslint-disable-line
                  : <ShoppingBag className="w-7 h-7 text-gray-300" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{title}</p>
                {category && <p className="text-xs text-gray-400 mt-0.5">{category}</p>}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                  <span>Qty: <strong className="text-gray-800">{order.quantity}</strong></span>
                  <span>Unit price: <strong className="text-gray-800">₦{(order.amount / order.quantity).toLocaleString()}</strong></span>
                </div>
              </div>
            </div>
            {order.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-1">Buyer Notes</p>
                <p className="text-sm text-gray-700">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Shipping address */}
          {order.shippingAddress && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Delivery Address
              </h2>
              <div className="text-sm text-gray-700 space-y-0.5">
                <p className="font-semibold">{order.shippingName}</p>
                {order.shippingPhone && <p className="text-gray-500">{order.shippingPhone}</p>}
                <p>{order.shippingAddress}</p>
                <p>{[order.shippingCity, order.shippingState, order.shippingCountry].filter(Boolean).join(", ")}</p>
              </div>
              {order.shippingZone && (
                <span className={cn("mt-2 inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full",
                  order.shippingZone === "NIGERIA" ? "bg-green-50 text-green-700" :
                  order.shippingZone === "AFRICA"  ? "bg-blue-50 text-blue-700" :
                  "bg-purple-50 text-purple-700"
                )}>
                  {order.shippingZone === "NIGERIA" ? "🇳🇬" : order.shippingZone === "AFRICA" ? "🌍" : "🌐"}
                  {" "}{order.shippingZone}
                </span>
              )}
            </div>
          )}

          {/* Tracking info */}
          {order.trackingNumber && (
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-purple-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4" /> Tracking Info
              </h2>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Courier</span>
                  <span className="font-semibold text-gray-800">{order.courierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tracking #</span>
                  <span className="font-mono font-bold text-gray-800">{order.trackingNumber}</span>
                </div>
                {order.estimatedDays && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Est. Delivery</span>
                    <span className="font-semibold text-gray-800">{order.estimatedDays} days</span>
                  </div>
                )}
                {order.trackingUrl && (
                  <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 mt-2"
                  >
                    <ExternalLink className="w-3 h-3" /> Track on courier website
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Order timeline */}
          {!isFinal && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-5">
                Order Timeline
              </h2>
              <div className="relative">
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100" />
                <ol className="space-y-4 relative">
                  {TIMELINE.map(({ status, label }, i) => {
                    const rank    = STATUS_RANK[status] ?? i;
                    const isDone  = rank < currentRank;
                    const isCurr  = rank === Math.floor(currentRank);
                    return (
                      <li key={status} className="flex items-center gap-4 pl-0">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2",
                          isDone  ? "bg-primary-600 border-primary-600"    :
                          isCurr  ? "bg-white border-primary-500 shadow-md" :
                                    "bg-white border-gray-200"
                        )}>
                          {isDone
                            ? <CheckCircle2 className="w-4 h-4 text-white" />
                            : <div className={cn("w-2 h-2 rounded-full", isCurr ? "bg-primary-500" : "bg-gray-200")} />
                          }
                        </div>
                        <div>
                          <p className={cn("text-sm font-semibold", isDone || isCurr ? "text-gray-900" : "text-gray-400")}>
                            {label}
                          </p>
                          {isCurr && <p className="text-xs text-primary-600">Current stage</p>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          )}

          {/* Interactive seller actions */}
          {!isFinal && (
            <SellerOrderActions
              orderId={order.id}
              status={order.status}
              courierName={order.courierName ?? ""}
              refundStatus={order.refundStatus}
              refundReason={order.refundReason}
            />
          )}

          {/* Cancelled / completed state */}
          {isFinal && (
            <div className={cn(
              "rounded-2xl border p-5 flex items-center gap-3",
              order.status === "COMPLETED" ? "bg-green-50 border-green-200"  :
              order.status === "DISPUTED"  ? "bg-orange-50 border-orange-200" :
                                             "bg-gray-50 border-gray-200"
            )}>
              <StatusIcon className={cn("w-5 h-5 flex-shrink-0", cfg.color.split(" ")[1])} />
              <div>
                <p className="font-bold text-gray-800">This order is {cfg.label.toLowerCase()}</p>
                <p className="text-xs text-gray-500 mt-0.5">
              order.status === "COMPLETED"  ? `₦${net.toLocaleString()} credited to your wallet.` :
                   order.status === "DISPUTED"   ? "Our team is reviewing this. Check your email for updates." :
                   "No further actions needed."
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right col (1/3) ───────────────────────────── */}
        <div className="space-y-4">

          {/* Earnings summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
              Earnings
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Order total</span>
                <span className="font-semibold text-gray-900">₦{order.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Platform fee (5%)</span>
                <span className="font-semibold text-red-500">−₦{fee.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between">
                <span className="font-bold text-gray-700">You receive</span>
                <span className="font-black text-gray-900">₦{net.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Buyer card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
              Buyer
            </h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-black flex-shrink-0">
                {(order.buyer.name ?? order.buyer.email ?? "?").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-800 text-sm truncate">{order.buyer.name ?? "Anonymous"}</p>
                <p className="text-xs text-gray-400 truncate">{order.buyer.email}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <User2 className="w-3.5 h-3.5" />
                Member since {new Date(order.buyer.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </div>
            </div>
            <Link
              href={
                order.conversation
                  ? `/dashboard/seller/messages?conv=${order.conversation.id}`
                  : `/dashboard/seller/messages`
              }
              className="mt-4 flex items-center justify-center gap-2 w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Message Buyer
            </Link>
          </div>

          {/* Order meta */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">
              Order Info
            </h2>
            <dl className="space-y-2 text-xs">
              {[
                { label: "Order ID",   value: order.id.slice(-12).toUpperCase() },
                { label: "Type",       value: order.type === "PRODUCT" ? "Physical Product" : "Freelance Service" },
                { label: "Placed",     value: new Date(order.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) },
                { label: "Updated",    value: new Date(order.updatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt className="text-gray-400 flex-shrink-0">{label}</dt>
                  <dd className="font-medium text-gray-700 text-right break-all">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
