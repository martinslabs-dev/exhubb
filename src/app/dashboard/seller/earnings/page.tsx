import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import WithdrawalForm from "./WithdrawalForm";
import {
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  Info,
  Package,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Banknote,
  Download,
} from "lucide-react";

export const metadata: Metadata = { title: "Earnings" };

export default async function SellerEarningsPage() {
  const session = await auth();
  const uid = session!.user.id;

  const [dbUser, completedOrders, pendingOrders, allOrders, walletTxns] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: uid },
        select: { walletBalance: true, bankName: true, bankAccountName: true, bankAccountNumber: true },
      }),
      prisma.order.findMany({
        where: { sellerId: uid, status: { in: ["COMPLETED", "DELIVERED"] } },
        include: { product: { select: { title: true } }, gig: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.order.aggregate({
        where: { sellerId: uid, status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS", "SHIPPED"] } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: { sellerId: uid, status: { in: ["COMPLETED", "DELIVERED"] } },
        _sum: { amount: true },
      }),
      prisma.walletTransaction.findMany({
        where: { userId: uid },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    ]);

  const totalEarned     = allOrders._sum.amount    ?? 0;
  const pendingAmount   = pendingOrders._sum.amount ?? 0;
  const platformFeeRate = 0.05;
  const netEarned       = totalEarned * (1 - platformFeeRate);
  const walletBalance   = dbUser?.walletBalance ?? 0;

  const STATS = [
    { label: "Total Earned",      value: `₦${totalEarned.toLocaleString()}`,       sub: "Before fees",                        icon: TrendingUp, color: "text-green-600",   bg: "bg-green-50"   },
    { label: "Net Earnings",      value: `₦${netEarned.toLocaleString()}`,         sub: "After 5% fee",                       icon: Banknote,   color: "text-primary-600", bg: "bg-primary-50" },
    { label: "Pending Clearance", value: `₦${pendingAmount.toLocaleString()}`,     sub: `${pendingOrders._count} active orders`, icon: Clock,     color: "text-amber-500",  bg: "bg-amber-50"   },
    { label: "Wallet Balance",    value: `₦${walletBalance.toLocaleString()}`,     sub: "Ready to withdraw",                  icon: Wallet,     color: "text-indigo-600", bg: "bg-indigo-50"  },
  ];

  const MONTHS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Earnings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your revenue and payouts</p>
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
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-primary-200">Wallet Balance</p>
            <p className="text-4xl font-black mt-1">₦{walletBalance.toLocaleString()}</p>
            <p className="text-primary-200 text-sm mt-2">
              Funds clear 7 days after order completion.
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <Wallet className="w-7 h-7 text-white/80" />
          </div>
        </div>
      </div>

      {/* ── Fee info banner ───────────────────────────────── */}
      <div className="flex items-start gap-3 bg-primary-50 border border-primary-100 rounded-2xl p-4">
        <Info className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-primary-700">
          Exhubb charges a <strong>5% platform fee</strong> on each completed sale. Payments are held for 7 days after delivery confirmation before becoming available for withdrawal.
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
                    className="w-full bg-primary-100 rounded-lg hover:bg-primary-200 transition-colors"
                    style={{ height: `${Math.max(h, 4)}%` }}
                  />
                  <span className="text-xs text-gray-400">{MONTHS[i]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Withdrawal form ───────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-base font-black text-gray-900 mb-1">Withdraw Funds</h2>
          <p className="text-xs text-gray-400 mb-4">Minimum withdrawal: ₦5,000</p>
          <WithdrawalForm
            walletBalance={walletBalance}
            bankName={dbUser?.bankName ?? null}
            bankAccountName={dbUser?.bankAccountName ?? null}
            bankAccountNumber={dbUser?.bankAccountNumber ?? null}
          />
        </div>
      </div>

      {/* ── Wallet Transaction History ─────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-base font-black text-gray-900 mb-4">Wallet Transactions</h2>

        {walletTxns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="w-9 h-9 text-gray-100 mb-3" />
            <p className="text-sm font-semibold text-gray-400">No transactions yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">Wallet credits, debits and payouts will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {walletTxns.map((txn) => {
              const isCredit = ["TOP_UP", "SALE_CREDIT", "REFUND"].includes(txn.type);
              const isDebit  = ["PURCHASE", "PAYOUT", "FEE"].includes(txn.type);
              const label = {
                TOP_UP:      "Top-up",
                PURCHASE:    "Purchase",
                SALE_CREDIT: "Sale credit",
                PAYOUT:      "Withdrawal",
                REFUND:      "Refund",
                FEE:         "Platform fee",
              }[txn.type] ?? txn.type;
              const statusColor = txn.status === "COMPLETED" ? "text-gray-400" : txn.status === "PENDING" ? "text-amber-500" : "text-red-400";
              return (
                <div key={txn.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                      isCredit ? "bg-green-50" : "bg-red-50"
                    )}>
                      {isCredit
                        ? <ArrowDownLeft className="w-4 h-4 text-green-600" />
                        : <ArrowUpRight  className="w-4 h-4 text-red-500" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(txn.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                        {txn.description ? ` · ${txn.description}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-sm font-black", isCredit ? "text-green-600" : "text-red-500")}>
                      {isCredit ? "+" : "-"}₦{txn.amount.toLocaleString()}
                    </p>
                    <p className={cn("text-xs font-medium", statusColor)}>{txn.status}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Completed order credits ───────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-base font-black text-gray-900 mb-4">Completed Sales</h2>

        {completedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="w-9 h-9 text-gray-100 mb-3" />
            <p className="text-sm font-semibold text-gray-400">No completed sales yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">Completed orders will appear here as transactions.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {completedOrders.map((order) => {
              const title = order.product?.title ?? order.gig?.title ?? "Order";
              const net   = order.amount * (1 - platformFeeRate);
              return (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-green-50">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">{title}</p>
                      <p className="text-xs text-gray-400">
                        #{order.id.slice(-8).toUpperCase()} · {new Date(order.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-green-600">+₦{net.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Gross ₦{order.amount.toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Payout setup banner ───────────────────────────── */}
      {walletBalance === 0 && totalEarned === 0 && (
        <div className="flex items-start gap-4 bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
          <AlertCircle className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-indigo-800">Set up your payout method</p>
            <p className="text-xs text-indigo-600 mt-0.5">Add a bank account to receive your earnings when you start making sales.</p>
          </div>
          <Link
            href="/dashboard/seller/store"
            className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-800 transition-colors"
          >
            Add bank <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
