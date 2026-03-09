import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  RefreshCcw,
  TrendingUp,
  ArrowRight,
  CreditCard,
  ShieldCheck,
  Download,
} from "lucide-react";

export const metadata: Metadata = { title: "Wallet" };

const TX_CONFIG: Record<string, { label: string; color: string; bg: string; sign: string; icon: React.ElementType }> = {
  TOP_UP:       { label: "Top-up",       color: "text-green-600",  bg: "bg-green-50",  sign: "+", icon: Plus          },
  PURCHASE:     { label: "Purchase",     color: "text-red-500",    bg: "bg-red-50",    sign: "-", icon: ArrowUpRight   },
  SALE_CREDIT:  { label: "Sale",         color: "text-green-600",  bg: "bg-green-50",  sign: "+", icon: TrendingUp     },
  PAYOUT:       { label: "Payout",       color: "text-indigo-600", bg: "bg-indigo-50", sign: "-", icon: ArrowUpRight   },
  REFUND:       { label: "Refund",       color: "text-blue-600",   bg: "bg-blue-50",   sign: "+", icon: RefreshCcw     },
  FEE:          { label: "Fee",          color: "text-gray-500",   bg: "bg-gray-100",  sign: "-", icon: DollarSign     },
};

export default async function WalletPage() {
  const session = await auth();

  const userRaw = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { name: true },
  });

  const [transactions, walletUser] = await Promise.all([
    prisma.walletTransaction.findMany({
      where:   { userId: session!.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.user.findUnique({
      where:  { id: session!.user.id },
      select: { walletBalance: true },
    }),
  ]);
  const balance = walletUser?.walletBalance ?? 0;

  const user = userRaw;
  const totalIn      = transactions.filter((t) => ["TOP_UP", "SALE_CREDIT", "REFUND"].includes(t.type)).reduce((s, t) => s + t.amount, 0);
  const totalOut     = transactions.filter((t) => ["PURCHASE", "PAYOUT", "FEE"].includes(t.type)).reduce((s, t) => s + t.amount, 0);
  const pendingCount = transactions.filter((t) => t.status === "PENDING").length;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Wallet</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your Exhubb balance</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* ── Balance card ──────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden">
        {/* decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-primary-200 text-sm font-semibold">Total Balance</p>
              <p className="text-5xl font-black mt-1 tracking-tight">
                ${balance.toFixed(2)}
              </p>
              <p className="text-primary-200 text-sm mt-2">
                {user?.name ?? "Exhubb"} · Exhubb Wallet
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
              <Wallet className="w-7 h-7 text-white/80" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-primary-700 text-sm font-black hover:bg-primary-50 transition-colors">
              <Plus className="w-4 h-4" />
              Add Funds
            </button>
            <Link
              href="/dashboard/settings/payouts"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/20 text-white text-sm font-bold transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
              Withdraw
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats bar ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total In",       value: `$${totalIn.toFixed(2)}`,  color: "text-green-600",  bg: "bg-green-50",  icon: ArrowDownLeft  },
          { label: "Total Out",      value: `$${totalOut.toFixed(2)}`, color: "text-red-500",    bg: "bg-red-50",    icon: ArrowUpRight   },
          { label: "Pending",        value: pendingCount,              color: "text-amber-600",  bg: "bg-amber-50",  icon: RefreshCcw     },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", bg)}>
              <Icon className={cn("w-4 h-4", color)} />
            </div>
            <div>
              <p className={cn("text-lg font-black", color)}>{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick actions ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Add Funds",    icon: Plus,         color: "text-primary-600", bg: "bg-primary-50"  },
            { label: "Withdraw",     icon: ArrowUpRight, color: "text-indigo-600",  bg: "bg-indigo-50"   },
            { label: "Pay Someone",  icon: DollarSign,   color: "text-green-600",   bg: "bg-green-50"    },
            { label: "Payout Setup", icon: CreditCard,   color: "text-amber-600",   bg: "bg-amber-50"    },
          ].map(({ label, icon: Icon, color, bg }) => (
            <button
              key={label}
              className="flex flex-col items-center gap-2 py-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-gray-50 transition-all text-center"
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bg)}>
                <Icon className={cn("w-5 h-5", color)} />
              </div>
              <span className="text-xs font-semibold text-gray-600">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Transaction History ───────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-black text-gray-900">Transaction History</h2>
          {transactions.length > 10 && (
            <button className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <Wallet className="w-7 h-7 text-gray-200" />
            </div>
            <p className="text-sm font-semibold text-gray-400">No transactions yet</p>
            <p className="text-xs text-gray-400 mt-1">Add funds to get started.</p>
            <button className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-colors">
              <Plus className="w-4 h-4" /> Add Funds
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map((tx: any) => {
              const cfg   = TX_CONFIG[tx.type] ?? TX_CONFIG.FEE;
              const TxIcon = cfg.icon;
              const isIn  = ["+"].includes(cfg.sign);
              return (
                <div key={tx.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", cfg.bg)}>
                    <TxIcon className={cn("w-4 h-4", cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{cfg.label}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {tx.description ?? `#${tx.id.slice(-8).toUpperCase()}`}
                      {tx.status === "PENDING" && <span className="ml-1.5 text-amber-500 font-semibold">· Pending</span>}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn("text-sm font-black", isIn ? "text-green-600" : "text-gray-700")}>
                      {cfg.sign}${tx.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Security note ─────────────────────────────────── */}
      <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-5 py-4">
        <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
        <p className="text-xs text-gray-500">
          Your wallet is secured with end-to-end encryption. Exhubb never stores full card details.
        </p>
      </div>
    </div>
  );
}
