import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import {
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Download,
  CreditCard,
  DollarSign,
  Info,
  Briefcase,
  AlertCircle,
} from "lucide-react";

export const metadata: Metadata = { title: "Freelancer Earnings" };

export default async function FreelancerEarningsPage() {
  const session = await auth();

  const [completedOrders, pendingAgg, totalAgg] = await Promise.all([
    prisma.order.findMany({
      where: { sellerId: session!.user.id, gigId: { not: null }, status: { in: ["COMPLETED", "DELIVERED"] } },
      include: { gig: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.order.aggregate({
      where: { sellerId: session!.user.id, gigId: { not: null }, status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { sellerId: session!.user.id, gigId: { not: null }, status: { in: ["COMPLETED", "DELIVERED"] } },
      _sum: { amount: true },
    }),
  ]);

  const totalEarned     = totalAgg._sum.amount   ?? 0;
  const pendingAmount   = pendingAgg._sum.amount  ?? 0;
  const platformFeeRate = 0.20; // 20% for freelancers (common marketplace rate)
  const netEarned       = totalEarned * (1 - platformFeeRate);
  const availablePayout = 0;

  const STATS = [
    { label: "Gross Earned",      value: `$${totalEarned.toFixed(2)}`,   sub: "Before fees",         icon: TrendingUp, color: "text-green-600",  bg: "bg-green-50"  },
    { label: "Net Earnings",      value: `$${netEarned.toFixed(2)}`,     sub: "After 20% fee",       icon: DollarSign, color: "text-primary-600", bg: "bg-primary-50"},
    { label: "Pending Clearance", value: `$${pendingAmount.toFixed(2)}`, sub: `${pendingAgg._count} active`, icon: Clock, color: "text-amber-500", bg: "bg-amber-50"},
    { label: "Available Payout",  value: `$0.00`,                        sub: "Ready to withdraw",   icon: Wallet,     color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  const MONTHS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Earnings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your freelance revenue and payouts</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* ── Stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-black text-gray-900">{value}</p>
            <p className="text-xs font-semibold text-gray-600 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Payout card ───────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-200">Available for Withdrawal</p>
            <p className="text-4xl font-black mt-1">${availablePayout.toFixed(2)}</p>
            <p className="text-indigo-200 text-sm mt-2">
              Funds clear 14 days after order completion.
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <Wallet className="w-7 h-7 text-white/80" />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-5">
          <button
            disabled={availablePayout === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 text-sm font-black hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CreditCard className="w-4 h-4" />
            Withdraw Funds
          </button>
          <Link
            href="/dashboard/settings/payouts"
            className="flex items-center gap-1.5 text-sm font-semibold text-indigo-200 hover:text-white transition-colors"
          >
            Payout settings <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── Fee info ──────────────────────────────────────── */}
      <div className="flex items-start gap-3 bg-primary-50 border border-primary-100 rounded-2xl p-4">
        <Info className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-primary-700">
          Exhubb charges a <strong>20% service fee</strong> on freelance orders. Payments are held for 14 days after delivery confirmation before becoming available for withdrawal.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Revenue chart ─────────────────────────────── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-base font-black text-gray-900 mb-1">Monthly Revenue</h2>
          <p className="text-xs text-gray-400 mb-5">Gross earnings before fees</p>
          {totalEarned === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <TrendingUp className="w-8 h-8 text-gray-100 mb-2" />
              <p className="text-sm text-gray-400">No revenue yet</p>
            </div>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {[0, 0, 0, 0, 0, totalEarned > 0 ? 60 : 0].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors"
                    style={{ height: `${Math.max(h, 4)}%` }}
                  />
                  <span className="text-xs text-gray-400">{MONTHS[i]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Fee breakdown ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-base font-black text-gray-900 mb-4">Fee Breakdown</h2>
          <div className="space-y-3">
            {[
              { label: "Gross Revenue",    value: `$${totalEarned.toFixed(2)}`,                      color: "text-gray-900" },
              { label: "Platform Fee (20%)", value: `-$${(totalEarned * platformFeeRate).toFixed(2)}`, color: "text-red-500"  },
              { label: "Net Earnings",     value: `$${netEarned.toFixed(2)}`,                        color: "text-green-600 font-black" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-600">{label}</span>
                <span className={cn("text-sm font-bold", color)}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Transaction History ───────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-base font-black text-gray-900 mb-4">Transaction History</h2>

        {completedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Briefcase className="w-9 h-9 text-gray-100 mb-3" />
            <p className="text-sm font-semibold text-gray-400">No transactions yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">Completed service orders will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {completedOrders.map((order) => {
              const title  = order.gig?.title ?? "Service Order";
              const net    = order.amount * (1 - platformFeeRate);
              const isComp = order.status === "COMPLETED";
              return (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                      isComp ? "bg-green-50" : "bg-indigo-50"
                    )}>
                      {isComp
                        ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                        : <Briefcase    className="w-4 h-4 text-indigo-600" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">{title}</p>
                      <p className="text-xs text-gray-400">
                        #{order.id.slice(-8).toUpperCase()} · {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-green-600">+${net.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">Gross ${order.amount.toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Setup banner ──────────────────────────────────── */}
      {totalEarned === 0 && (
        <div className="flex items-start gap-4 bg-purple-50 border border-purple-100 rounded-2xl p-5">
          <AlertCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-purple-800">Ready to start earning?</p>
            <p className="text-xs text-purple-600 mt-0.5">Create your first gig and start offering services. Set up your payout method to receive payments.</p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Link
              href="/dashboard/freelancer/gigs/new"
              className="text-xs font-bold text-purple-700 hover:text-purple-800 transition-colors whitespace-nowrap flex items-center gap-1"
            >
              Create Gig <ArrowRight className="w-3 h-3" />
            </Link>
            <Link
              href="/dashboard/settings/payouts"
              className="text-xs font-bold text-purple-700 hover:text-purple-800 transition-colors whitespace-nowrap flex items-center gap-1"
            >
              Setup Payouts <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
