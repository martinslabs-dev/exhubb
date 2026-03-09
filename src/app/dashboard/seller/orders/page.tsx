import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  RefreshCcw,
  ArrowRight,
  ShoppingBag,
  MessageSquare,
} from "lucide-react";

export const metadata: Metadata = { title: "Seller Orders" };

const STATUS_CONFIG = {
  PENDING:     { label: "Pending",     color: "bg-yellow-100 text-yellow-700", icon: Clock        },
  CONFIRMED:   { label: "Confirmed",   color: "bg-blue-100 text-blue-700",     icon: CheckCircle2 },
  IN_PROGRESS: { label: "In Progress", color: "bg-indigo-100 text-indigo-700", icon: RefreshCcw   },
  SHIPPED:     { label: "Shipped",     color: "bg-purple-100 text-purple-700", icon: Truck        },
  DELIVERED:   { label: "Delivered",   color: "bg-green-100 text-green-700",   icon: Package      },
  COMPLETED:   { label: "Completed",   color: "bg-green-100 text-green-700",   icon: CheckCircle2 },
  CANCELLED:   { label: "Cancelled",   color: "bg-red-100 text-red-600",       icon: XCircle      },
  REFUNDED:    { label: "Refunded",    color: "bg-gray-100 text-gray-600",     icon: RefreshCcw   },
  DISPUTED:    { label: "Disputed",    color: "bg-orange-100 text-orange-700", icon: XCircle      },
} as const;

const TABS = [
  { id: "all",       label: "All Orders"     },
  { id: "new",       label: "New"            },
  { id: "active",    label: "In Progress"    },
  { id: "completed", label: "Completed"      },
];

export default async function SellerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  const params  = await searchParams;
  const tab     = params.tab ?? "all";

  const orders = await prisma.order.findMany({
    where: {
      sellerId: session!.user.id,
      ...(tab === "new"       && { status: "PENDING"                                                       }),
      ...(tab === "active"    && { status: { in: ["CONFIRMED", "IN_PROGRESS", "SHIPPED"] }                }),
      ...(tab === "completed" && { status: { in: ["DELIVERED", "COMPLETED", "CANCELLED", "REFUNDED"] }    }),
    },
    include: {
      product: { select: { title: true, images: true } },
      gig:     { select: { title: true } },
      buyer:   { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const newCount   = orders.filter((o) => o.status === "PENDING").length;
  const needAction = orders.filter((o) => ["PENDING", "CONFIRMED"].includes(o.status)).length;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {orders.length} order{orders.length !== 1 ? "s" : ""}
            {newCount > 0 && <span className="ml-1.5 text-xs font-bold text-orange-500">· {newCount} new</span>}
          </p>
        </div>
        {needAction > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl">
            <Clock className="w-4 h-4 text-orange-500" />
            <p className="text-xs font-bold text-orange-700">{needAction} need action</p>
          </div>
        )}
      </div>

      {/* ── Tabs ──────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-gray-100 overflow-x-auto scrollbar-hide">
        {TABS.map(({ id, label }) => (
          <Link
            key={id}
            href={`/dashboard/seller/orders?tab=${id}`}
            className={cn(
              "flex-shrink-0 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors",
              tab === id
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* ── Orders ────────────────────────────────────────── */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
            <ShoppingBag className="w-9 h-9 text-gray-200" />
          </div>
          <p className="text-lg font-bold text-gray-700 mb-1">No orders yet</p>
          <p className="text-sm text-gray-400 mb-6 max-w-xs">
            {tab === "all"
              ? "Once customers place orders, they'll appear here."
              : `No ${tab} orders found.`}
          </p>
          <Link
            href="/dashboard/seller/listings"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-colors"
          >
            <Package className="w-4 h-4" /> Manage Listings
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const cfg        = STATUS_CONFIG[order.status];
            const StatusIcon = cfg.icon;
            const title      = order.product?.title ?? order.gig?.title ?? "Order";
            const thumb      = order.product?.images?.[0];
            const isNew      = order.status === "PENDING";

            return (
              <div
                key={order.id}
                className={cn(
                  "bg-white rounded-2xl border p-4 flex items-center gap-4 hover:shadow-sm transition-all",
                  isNew ? "border-orange-200 bg-orange-50/30" : "border-gray-100 hover:border-primary-200"
                )}
              >
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {thumb
                    ? <img src={thumb} alt={title} className="w-full h-full object-cover" /> // eslint-disable-line
                    : <Package className="w-6 h-6 text-gray-300" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900 truncate">{title}</p>
                    {isNew && <span className="flex-shrink-0 text-[10px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded-full">NEW</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Buyer: {order.buyer.name ?? order.buyer.email} · #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full", cfg.color)}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <span className="text-xs text-gray-400">Qty: {order.quantity}</span>
                  </div>
                </div>

                {/* Amount + actions */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <p className="text-base font-black text-gray-900">${order.amount.toFixed(2)}</p>
                  <div className="flex items-center gap-1">
                    {isNew && (
                      <button className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors">
                        Accept
                      </button>
                    )}
                    <button className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                      <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    <Link
                      href={`/dashboard/seller/orders/${order.id}`}
                      className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
