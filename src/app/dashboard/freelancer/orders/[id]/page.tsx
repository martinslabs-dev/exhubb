import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { updateOrderStatusAction } from "@/lib/actions/orders";
import {
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  ArrowLeft,
  User2,
  MessageSquare,
  Calendar,
  Hash,
  AlertTriangle,
  Timer,
} from "lucide-react";

export const metadata: Metadata = { title: "Order Details" };

const STATUS_CONFIG = {
  PENDING:     { label: "Pending",     color: "bg-yellow-100 text-yellow-700",  icon: Clock        },
  CONFIRMED:   { label: "Confirmed",   color: "bg-blue-100 text-blue-700",      icon: CheckCircle2 },
  IN_PROGRESS: { label: "In Progress", color: "bg-indigo-100 text-indigo-700",  icon: RefreshCcw   },
  SHIPPED:     { label: "Delivering",  color: "bg-purple-100 text-purple-700",  icon: Timer        },
  DELIVERED:   { label: "Delivered",   color: "bg-green-100 text-green-700",    icon: CheckCircle2 },
  COMPLETED:   { label: "Completed",   color: "bg-green-100 text-green-700",    icon: CheckCircle2 },
  CANCELLED:   { label: "Cancelled",   color: "bg-red-100 text-red-600",        icon: XCircle      },
  REFUNDED:    { label: "Refunded",    color: "bg-gray-100 text-gray-600",      icon: RefreshCcw   },
  DISPUTED:    { label: "Disputed",    color: "bg-orange-100 text-orange-700",  icon: AlertTriangle},
} as const;

const NEXT_ACTIONS: Partial<Record<keyof typeof STATUS_CONFIG, { status: string; label: string; primary?: boolean }[]>> = {
  PENDING:     [{ status: "CONFIRMED",   label: "Accept Order",      primary: true }, { status: "CANCELLED", label: "Decline" }],
  CONFIRMED:   [{ status: "IN_PROGRESS", label: "Start Working",     primary: true }],
  IN_PROGRESS: [{ status: "COMPLETED",   label: "Deliver & Complete", primary: true }],
};

const TIMELINE: { status: keyof typeof STATUS_CONFIG; label: string }[] = [
  { status: "PENDING",     label: "Order Placed"  },
  { status: "CONFIRMED",   label: "Accepted"      },
  { status: "IN_PROGRESS", label: "In Progress"   },
  { status: "COMPLETED",   label: "Delivered"     },
];

const STATUS_RANK: Record<string, number> = {
  PENDING: 0, CONFIRMED: 1, IN_PROGRESS: 2, SHIPPED: 2.5, COMPLETED: 3,
};

export default async function FreelancerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where:   { id },
    include: {
      gig:     { select: { title: true, category: true, deliveryDays: true, basicPrice: true } },
      product: { select: { title: true, images: true, category: true } },
      buyer:   { select: { name: true, email: true, image: true, createdAt: true } },
    },
  });

  if (!order || order.sellerId !== session.user.id) notFound();

  const cfg        = STATUS_CONFIG[order.status];
  const StatusIcon = cfg.icon;
  const title      = order.gig?.title ?? order.product?.title ?? "Order";
  const category   = order.gig?.category ?? order.product?.category ?? null;
  const actions    = NEXT_ACTIONS[order.status as keyof typeof STATUS_CONFIG] ?? [];
  const feeRate    = 0.20;
  const fee        = order.amount * feeRate;
  const net        = order.amount - fee;
  const isFinal    = ["COMPLETED", "CANCELLED", "REFUNDED", "DISPUTED"].includes(order.status);
  const currentRank = STATUS_RANK[order.status] ?? -1;

  // Calculate deadline if delivery days are set
  const deliveryDays = order.gig?.deliveryDays;
  const deadline = order.status === "IN_PROGRESS" && deliveryDays
    ? new Date(order.updatedAt.getTime() + deliveryDays * 24 * 60 * 60 * 1000)
    : null;
  const isOverdue = deadline && deadline < new Date();

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl mx-auto space-y-6">

      {/* ── Back + Header ─────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <Link
          href="/dashboard/freelancer/orders"
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
            {isOverdue && (
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-red-100 text-red-600 px-2.5 py-1 rounded-full">
                <AlertTriangle className="w-3 h-3" />
                Overdue
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
            <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{order.id.slice(-12).toUpperCase()}</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
            {category && <span className="bg-gray-100 px-2 py-0.5 rounded-full">{category}</span>}
          </div>
        </div>
      </div>

      {/* Deadline banner */}
      {deadline && !isFinal && (
        <div className={cn(
          "flex items-center gap-3 rounded-xl border px-4 py-3",
          isOverdue ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
        )}>
          <Timer className={cn("w-4 h-4 flex-shrink-0", isOverdue ? "text-red-500" : "text-amber-500")} />
          <p className={cn("text-sm font-semibold", isOverdue ? "text-red-700" : "text-amber-700")}>
            {isOverdue
              ? `Delivery was due on ${deadline.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — please deliver ASAP`
              : `Due by ${deadline.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left col ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Gig / Service card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Service</h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{title}</p>
                {category && <p className="text-xs text-gray-400 mt-0.5">{category}</p>}
                {deliveryDays && (
                  <p className="text-xs text-gray-500 mt-1">
                    Delivery: <strong className="text-gray-800">{deliveryDays} day{deliveryDays !== 1 ? "s" : ""}</strong>
                  </p>
                )}
              </div>
            </div>
            {order.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-1">Client Notes</p>
                <p className="text-sm text-gray-700">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          {!isFinal && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-5">Progress</h2>
              <div className="relative">
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100" />
                <ol className="space-y-4 relative">
                  {TIMELINE.map(({ status, label }) => {
                    const rank   = STATUS_RANK[status] ?? 0;
                    const isDone = rank < currentRank;
                    const isCurr = rank === Math.floor(currentRank);
                    return (
                      <li key={status} className="flex items-center gap-4">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2",
                          isDone ? "bg-primary-600 border-primary-600" :
                          isCurr ? "bg-white border-primary-500 shadow-md" :
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

          {/* Actions */}
          {actions.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Actions</h2>
              <div className="flex items-center gap-3 flex-wrap">
                {actions.map(({ status, label, primary }) => (
                  <form key={status} action={updateOrderStatusAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="status"  value={status}   />
                    <input type="hidden" name="role"    value="freelancer" />
                    <button
                      type="submit"
                      className={cn(
                        "px-5 py-2.5 text-sm font-bold rounded-xl transition-colors",
                        primary
                          ? "bg-primary-600 text-white hover:bg-primary-700 shadow-sm"
                          : status === "CANCELLED"
                          ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      {label}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          )}

          {isFinal && (
            <div className={cn(
              "rounded-2xl border p-5 flex items-center gap-3",
              order.status === "COMPLETED" ? "bg-green-50 border-green-200" :
              order.status === "DISPUTED"  ? "bg-orange-50 border-orange-200" :
                                             "bg-gray-50 border-gray-200"
            )}>
              <StatusIcon className={cn("w-5 h-5 flex-shrink-0", cfg.color.split(" ")[1])} />
              <div>
                <p className="font-bold text-gray-800">This order is {cfg.label.toLowerCase()}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {order.status === "COMPLETED"
                    ? "Your earnings have been credited to your balance (after 14-day hold)."
                    : "No further actions required."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right col ─────────────────────────────────── */}
        <div className="space-y-4">

          {/* Earnings */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Earnings</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Order total</span>
                <span className="font-semibold text-gray-900">${order.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Service fee (20%)</span>
                <span className="font-semibold text-red-500">−${fee.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between">
                <span className="font-bold text-gray-700">You receive</span>
                <span className="font-black text-gray-900">${net.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-3">
              Held for 14 days after completion before payout.
            </p>
          </div>

          {/* Client card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Client</h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-black flex-shrink-0">
                {(order.buyer.name ?? order.buyer.email ?? "?").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-800 text-sm truncate">{order.buyer.name ?? "Anonymous"}</p>
                <p className="text-xs text-gray-400 truncate">{order.buyer.email}</p>
              </div>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              <User2 className="w-3.5 h-3.5" />
              Member since {new Date(order.buyer.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </div>
            <Link
              href="/dashboard/freelancer/messages"
              className="mt-4 flex items-center justify-center gap-2 w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Message Client
            </Link>
          </div>

          {/* Meta */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Order Info</h2>
            <dl className="space-y-2 text-xs">
              {[
                { label: "Order ID", value: order.id.slice(-12).toUpperCase() },
                { label: "Placed",   value: new Date(order.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) },
                { label: "Updated",  value: new Date(order.updatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) },
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
