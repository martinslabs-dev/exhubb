import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import {
  ShoppingBag,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Search,
  Filter,
  RefreshCcw,
} from "lucide-react";

export const metadata: Metadata = { title: "My Orders" };

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
  { id: "all",       label: "All Orders"  },
  { id: "active",    label: "Active"      },
  { id: "delivered", label: "Delivered"   },
  { id: "cancelled", label: "Cancelled"   },
];

export default async function BuyerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const session = await auth();
  const params  = await searchParams;
  const tab     = params.tab ?? "all";
  const q       = params.q   ?? "";

  const orders = await prisma.order.findMany({
    where: {
      buyerId: session!.user.id,
      ...(tab === "active"    && { status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS", "SHIPPED"] } }),
      ...(tab === "delivered" && { status: { in: ["DELIVERED", "COMPLETED"] } }),
      ...(tab === "cancelled" && { status: { in: ["CANCELLED", "REFUNDED"] } }),
      ...(q && {
        OR: [
          { product: { title: { contains: q, mode: "insensitive" } } },
          { gig:     { title: { contains: q, mode: "insensitive" } } },
        ],
      }),
    },
    include: {
      product: { select: { title: true, images: true, category: true } },
      gig:     { select: { title: true, category: true } },
      seller:  { select: { name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">My Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {orders.length} order{orders.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors self-start"
        >
          <ShoppingBag className="w-4 h-4" />
          Shop More
        </Link>
      </div>

      {/* ── Search + Filters ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <form className="flex-1">
          <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-gray-200 bg-white focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search orders…"
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
            />
            {/* Preserve tab param */}
            <input type="hidden" name="tab" value={tab} />
          </div>
        </form>
        <button className="flex items-center gap-2 h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* ── Tab bar ───────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-gray-100 overflow-x-auto scrollbar-hide">
        {TABS.map(({ id, label }) => (
          <Link
            key={id}
            href={`/dashboard/buyer/orders?tab=${id}${q ? `&q=${q}` : ""}`}
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

      {/* ── Orders List ───────────────────────────────────── */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
            <ShoppingBag className="w-9 h-9 text-gray-200" />
          </div>
          <p className="text-lg font-bold text-gray-700 mb-1">No orders yet</p>
          <p className="text-sm text-gray-400 mb-6 max-w-xs">
            {tab === "all"
              ? "You haven't placed any orders yet. Start shopping!"
              : `No ${tab} orders found.`}
          </p>
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const cfg      = STATUS_CONFIG[order.status];
            const StatusIcon = cfg.icon;
            const title    = order.product?.title ?? order.gig?.title ?? "Order";
            const category = order.product?.category ?? order.gig?.category ?? "";
            const thumb    = order.product?.images?.[0];

            return (
              <Link
                key={order.id}
                href={`/dashboard/buyer/orders/${order.id}`}
                className="group flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 hover:border-primary-200 hover:shadow-sm transition-all"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt={title} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-7 h-7 text-gray-300" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                    {title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {category} · Seller: {order.seller.name ?? "Unknown"}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full", cfg.color)}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* Amount + arrow */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <p className="text-base font-black text-gray-900">
                    ${order.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">Qty: {order.quantity}</p>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors mt-1" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
