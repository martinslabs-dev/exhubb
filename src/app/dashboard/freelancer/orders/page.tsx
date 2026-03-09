import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  ArrowRight,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

export const metadata: Metadata = { title: "Active Orders" };

const STATUS_CONFIG = {
  PENDING:     { label: "Pending",     color: "bg-yellow-100 text-yellow-700", icon: Clock        },
  CONFIRMED:   { label: "Confirmed",   color: "bg-blue-100 text-blue-700",     icon: CheckCircle2 },
  IN_PROGRESS: { label: "In Progress", color: "bg-indigo-100 text-indigo-700", icon: RefreshCcw   },
  SHIPPED:     { label: "Delivered",   color: "bg-purple-100 text-purple-700", icon: CheckCircle2 },
  DELIVERED:   { label: "Delivered",   color: "bg-green-100 text-green-700",   icon: CheckCircle2 },
  COMPLETED:   { label: "Completed",   color: "bg-green-100 text-green-700",   icon: CheckCircle2 },
  CANCELLED:   { label: "Cancelled",   color: "bg-red-100 text-red-600",       icon: XCircle      },
  REFUNDED:    { label: "Refunded",    color: "bg-gray-100 text-gray-600",     icon: RefreshCcw   },
  DISPUTED:    { label: "Disputed",    color: "bg-orange-100 text-orange-700", icon: AlertCircle  },
} as const;

const TABS = [
  { id: "all",       label: "All Orders"  },
  { id: "active",    label: "In Progress" },
  { id: "review",    label: "Needs Action"},
  { id: "completed", label: "Completed"   },
];

export default async function FreelancerOrdersPage({
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
      gigId:    { not: null },
      ...(tab === "active"    && { status: { in: ["CONFIRMED", "IN_PROGRESS"]                      } }),
      ...(tab === "review"    && { status: { in: ["PENDING", "DISPUTED"]                           } }),
      ...(tab === "completed" && { status: { in: ["DELIVERED", "COMPLETED", "CANCELLED", "REFUNDED"] } }),
    },
    include: {
      gig:   { select: { title: true, category: true } },
      buyer: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const needAction = orders.filter((o) => ["PENDING", "DISPUTED"].includes(o.status)).length;
  const inProgress = orders.filter((o) => ["CONFIRMED", "IN_PROGRESS"].includes(o.status)).length;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Active Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {orders.length} order{orders.length !== 1 ? "s" : ""}
            {inProgress > 0 && <span className="ml-1.5 text-xs font-bold text-indigo-500">· {inProgress} in progress</span>}
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
      <div className="flex items-center gap-1 border-b border-gray-100 overflow-x-auto">
        {TABS.map(({ id, label }) => (
          <Link
            key={id}
            href={`/dashboard/freelancer/orders?tab=${id}`}
            className={cn(
              "flex-shrink-0 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors",
              tab === id
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {label}
            {id === "review" && needAction > 0 && (
              <span className="ml-1.5 text-[10px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded-full">
                {needAction}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* ── Orders ────────────────────────────────────────── */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5">
            <Briefcase className="w-9 h-9 text-indigo-200" />
          </div>
          <p className="text-lg font-bold text-gray-700 mb-1">No orders yet</p>
          <p className="text-sm text-gray-400 mb-6 max-w-xs">
            {tab === "all"
              ? "Client orders will appear here once they book your gigs."
              : `No ${tab} orders found.`}
          </p>
          <Link
            href="/dashboard/freelancer/gigs/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-colors"
          >
            <Briefcase className="w-4 h-4" /> Create a Gig
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const cfg        = STATUS_CONFIG[order.status];
            const StatusIcon = cfg.icon;
            const isNew      = order.status === "PENDING";
            const isDisputed = order.status === "DISPUTED";

            // Deadline: createdAt + deliveryDays (no deliveryDays on order, estimate 3 days)
            const dueDate = new Date(order.createdAt);
            dueDate.setDate(dueDate.getDate() + 3);
            const isOverdue = dueDate < new Date() && ["CONFIRMED", "IN_PROGRESS"].includes(order.status);

            return (
              <div
                key={order.id}
                className={cn(
                  "bg-white rounded-2xl border p-4 flex items-center gap-4 hover:shadow-sm transition-all",
                  isNew      ? "border-orange-200 bg-orange-50/30" :
                  isDisputed ? "border-red-200 bg-red-50/20" :
                  isOverdue  ? "border-yellow-200 bg-yellow-50/20" :
                  "border-gray-100 hover:border-primary-200"
                )}
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex-shrink-0 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-indigo-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {order.gig?.title ?? "Service Order"}
                    </p>
                    {isNew && (
                      <span className="flex-shrink-0 text-[10px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded-full">NEW</span>
                    )}
                    {isOverdue && (
                      <span className="flex-shrink-0 text-[10px] font-black bg-yellow-500 text-white px-1.5 py-0.5 rounded-full">OVERDUE</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Client: {order.buyer.name ?? order.buyer.email} · #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={cn(
                      "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
                      cfg.color
                    )}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    {order.gig?.category && (
                      <span className="text-xs text-gray-400">{order.gig.category}</span>
                    )}
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
                    {order.status === "IN_PROGRESS" && (
                      <button className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">
                        Deliver
                      </button>
                    )}
                    <button className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                      <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    <Link
                      href={`/dashboard/freelancer/orders/${order.id}`}
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
