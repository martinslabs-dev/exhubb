"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Wallet, Plus, ArrowUpRight, ArrowDownLeft, DollarSign,
  RefreshCcw, TrendingUp, CheckCircle2, ShieldCheck, X,
  SlidersHorizontal, Clock, ArrowDown, ArrowUp,
} from "lucide-react";
import FundModal    from "./FundModal";
import WithdrawModal from "./WithdrawModal";

interface TxRow {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  createdAt: Date;
}

interface SavedBank {
  bankName?: string | null;
  bankCode?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
}

interface Props {
  balance: number;
  userName: string;
  transactions: TxRow[];
  savedBank: SavedBank | null;
  // When redirected back from Flutterwave we pass txRef so the client can poll
  // until the webhook marks the transaction completed/failed.
  topupTxRef?: string | undefined;
  initialTopupStatus?: string | null;
}

type TxType = { label: string; color: string; bg: string; iconColor: string; sign: "+" | "-"; icon: React.ElementType };
const TX_CONFIG: Record<string, TxType> = {
  TOP_UP:      { label: "Top-up",   color: "text-emerald-700", bg: "bg-emerald-50",  iconColor: "text-emerald-500", sign: "+", icon: ArrowDown    },
  PURCHASE:    { label: "Purchase", color: "text-rose-600",    bg: "bg-rose-50",     iconColor: "text-rose-400",    sign: "-", icon: ArrowUp      },
  SALE_CREDIT: { label: "Sale",     color: "text-emerald-700", bg: "bg-emerald-50",  iconColor: "text-emerald-500", sign: "+", icon: TrendingUp   },
  PAYOUT:      { label: "Payout",   color: "text-violet-700",  bg: "bg-violet-50",   iconColor: "text-violet-500",  sign: "-", icon: ArrowUpRight },
  REFUND:      { label: "Refund",   color: "text-blue-700",    bg: "bg-blue-50",     iconColor: "text-blue-500",    sign: "+", icon: RefreshCcw   },
  FEE:         { label: "Fee",      color: "text-gray-500",    bg: "bg-gray-100",    iconColor: "text-gray-400",    sign: "-", icon: DollarSign   },
};

type FilterTab = "all" | "in" | "out" | "pending";

function formatTxDate(date: Date): string {
  const d    = new Date(date);
  const now  = new Date();
  const diff = now.setHours(0,0,0,0) - d.setHours(0,0,0,0);
  if (diff === 0)       return "Today";
  if (diff === 86400000) return "Yesterday";
  return new Date(date).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" });
}

function AnimatedBalance({ value }: { value: number }) {
  const count = useMotionValue(0);
  const formatted = useTransform(count, (v) =>
    `₦${v.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  );
  const [display, setDisplay] = useState(`₦${value.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.2, ease: "easeOut" });
    const unsub = formatted.on("change", setDisplay);
    return () => { controls.stop(); unsub(); };
  }, [value]);

  return <span>{display}</span>;
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { type: "spring" as const, damping: 22, stiffness: 300 } },
};

export default function WalletClient({ balance, userName, transactions, savedBank, topupTxRef, initialTopupStatus }: Props) {
  const [fundOpen,     setFundOpen]     = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [balanceState, setBalanceState] = useState<number>(balance);

  // bannerType: "none" | "pending" | "success" | "failed"
  const initBanner = (() => {
    if (initialTopupStatus === "COMPLETED") return "success";
    if (topupTxRef) return "pending";
    return "none";
  })();
  const [bannerType, setBannerType] = useState<string | null>(initBanner);
  const [filter,       setFilter]       = useState<FilterTab>("all");

  const totalIn  = transactions.filter((t) => ["TOP_UP", "SALE_CREDIT", "REFUND"].includes(t.type)).reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter((t) => ["PURCHASE", "PAYOUT", "FEE"].includes(t.type)).reduce((s, t) => s + t.amount, 0);
  const pending  = transactions.filter((t) => t.status === "PENDING").length;

  const filtered = transactions.filter((t) => {
    if (filter === "in")      return ["TOP_UP", "SALE_CREDIT", "REFUND"].includes(t.type);
    if (filter === "out")     return ["PURCHASE", "PAYOUT", "FEE"].includes(t.type);
    if (filter === "pending") return t.status === "PENDING";
    return true;
  });

  // Group by date label
  const grouped = filtered.reduce<Record<string, TxRow[]>>((acc, tx) => {
    const key = formatTxDate(tx.createdAt);
    (acc[key] ??= []).push(tx);
    return acc;
  }, {});

  // Poll transaction status when we have a txRef and it's not yet settled
  useEffect(() => {
    if (!topupTxRef) return;
    if (initialTopupStatus === "COMPLETED") return;
    let cancelled = false;
    let attempts = 0;

    const check = async () => {
      try {
        const res = await fetch(`/api/wallet/tx-status?reference=${encodeURIComponent(topupTxRef)}`);
        if (!res.ok) return;
        const body = await res.json();
        const status = body?.status;
        const newBalance = typeof body?.balance === "number" ? body.balance : undefined;

        if (status === "COMPLETED") {
          if (typeof newBalance === "number") setBalanceState(newBalance);
          setBannerType("success");
          cancelled = true;
          return;
        }

        if (status === "FAILED" || status === "CANCELLED") {
          setBannerType("failed");
          cancelled = true;
          return;
        }
      } catch (err) {
        // ignore and retry
      }
      attempts += 1;
      if (attempts >= 40) { cancelled = true; }
    };

    const iv = setInterval(() => { if (!cancelled) check(); }, 3000);
    // run immediate check
    check();
    return () => { cancelled = true; clearInterval(iv); };
  }, [topupTxRef]);

  return (
    <>
      <div className="min-h-screen bg-gray-50/60">
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-3xl mx-auto space-y-5">

          {/* ── Success banner ──────────────────────────── */}
          <AnimatePresence>
            {bannerType !== "none" && (
              <motion.div
                key="banner"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 320 }}
                className="overflow-hidden"
              >
                {bannerType === "pending" && (
                  <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <p className="text-sm text-amber-700 font-medium">
                        Top-up pending — confirming your payment. We'll update this page shortly.
                      </p>
                    </div>
                    <button
                      onClick={() => setBannerType(null)}
                      className="p-1 hover:bg-amber-100 rounded-lg transition-colors flex-shrink-0"
                      aria-label="Dismiss"
                    >
                      <X className="w-4 h-4 text-amber-400" />
                    </button>
                  </div>
                )}

                {bannerType === "success" && (
                  <div className="flex items-center justify-between gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <p className="text-sm text-emerald-700 font-medium">
                        Top-up successful — your wallet has been funded.
                      </p>
                    </div>
                    <button
                      onClick={() => setBannerType(null)}
                      className="p-1 hover:bg-emerald-100 rounded-lg transition-colors flex-shrink-0"
                      aria-label="Dismiss"
                    >
                      <X className="w-4 h-4 text-emerald-400" />
                    </button>
                  </div>
                )}

                {bannerType === "failed" && (
                  <div className="flex items-center justify-between gap-3 px-4 py-3 bg-rose-50 border border-rose-200 rounded-2xl">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-rose-500 flex-shrink-0" />
                      <p className="text-sm text-rose-700 font-medium">
                        Top-up failed or cancelled — no funds were added to your wallet.
                      </p>
                    </div>
                    <button
                      onClick={() => setBannerType(null)}
                      className="p-1 hover:bg-rose-100 rounded-lg transition-colors flex-shrink-0"
                      aria-label="Dismiss"
                    >
                      <X className="w-4 h-4 text-rose-400" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Page header ─────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Wallet</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage your Exhubb balance</p>
          </motion.div>

          {/* ── Balance card ────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", damping: 26, stiffness: 280, delay: 0.04 }}
            className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-700 text-white shadow-xl shadow-primary-900/20"
          >
            {/* Mesh blobs */}
            <div className="pointer-events-none absolute -top-12 -right-12 w-52 h-52 rounded-full bg-white/[0.06] blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-indigo-400/20 blur-2xl" />
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 bg-primary-400/10 blur-3xl rounded-full" />

            <div className="relative p-6 sm:p-8">
              {/* Top row */}
              <div className="flex items-start justify-between mb-1">
                <p className="text-primary-200 text-xs font-semibold uppercase tracking-widest">Total Balance</p>
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white/70" />
                </div>
              </div>

              {/* Amount */}
              <div className="text-3xl sm:text-5xl font-black tracking-tight tabular-nums mt-1 mb-1">
                <AnimatedBalance value={balanceState} />
              </div>
              <p className="text-primary-300 text-xs mb-6">{userName} · Exhubb Wallet</p>

              {/* CTAs */}
              <div className="flex flex-col xs:flex-row gap-2.5">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setFundOpen(true)}
                  className="flex flex-1 items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-primary-700 text-sm font-black hover:bg-primary-50 transition-colors shadow-lg shadow-black/10"
                >
                  <Plus className="w-4 h-4" />
                  Add Funds
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setWithdrawOpen(true)}
                  className="flex flex-1 items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20 text-white text-sm font-bold transition-colors"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Withdraw
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* ── Stats row ───────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.3 }}
            className="grid grid-cols-3 gap-2 sm:gap-3"
          >
            {[
              { label: "Money In",  value: totalIn,  color: "text-emerald-600", bg: "bg-emerald-50", icon: ArrowDownLeft },
              { label: "Money Out", value: totalOut, color: "text-rose-500",    bg: "bg-rose-50",    icon: ArrowUpRight  },
              { label: "Pending",   value: null,     color: "text-amber-600",   bg: "bg-amber-50",   icon: Clock, count: pending },
            ].map(({ label, value, color, bg, icon: Icon, count }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4">
                <div className={cn("w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center mb-2", bg)}>
                  <Icon className={cn("w-4 h-4", color)} />
                </div>
                <p className={cn("text-sm sm:text-base font-black leading-tight", color)}>
                  {count !== undefined
                    ? count
                    : `₦${(value ?? 0) >= 1_000_000
                        ? `${((value ?? 0) / 1_000_000).toFixed(1)}M`
                        : (value ?? 0) >= 1000
                        ? `${((value ?? 0) / 1000).toFixed(0)}k`
                        : (value ?? 0).toLocaleString()
                      }`
                  }
                </p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </motion.div>

          {/* ── Transaction History ─────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.3 }}
            className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm"
          >
            {/* Header + filters */}
            <div className="px-4 sm:px-6 pt-5 pb-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm sm:text-base font-black text-gray-900">Transactions</h2>
                <div className="flex items-center gap-1.5">
                  {pending > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-xs font-bold">
                      <Clock className="w-2.5 h-2.5" />{pending} pending
                    </span>
                  )}
                  <span className="text-xs text-gray-300 font-medium">{transactions.length} total</span>
                </div>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1 -mx-1 pb-0 overflow-x-auto scrollbar-none">
                {([
                  { key: "all",     label: "All" },
                  { key: "in",      label: "Money In" },
                  { key: "out",     label: "Money Out" },
                  { key: "pending", label: "Pending" },
                ] as { key: FilterTab; label: string }[]).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={cn(
                      "relative flex-shrink-0 px-3 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap",
                      filter === tab.key
                        ? "bg-gray-900 text-white"
                        : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="h-px bg-gray-100 mt-3" />
            </div>

            {/* Transaction list */}
            <div className="px-4 sm:px-6 pb-4">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                    <SlidersHorizontal className="w-6 h-6 text-gray-200" />
                  </div>
                  <p className="text-sm font-semibold text-gray-400">
                    {transactions.length === 0 ? "No transactions yet" : "No transactions match this filter"}
                  </p>
                  {transactions.length === 0 && (
                    <>
                      <p className="text-xs text-gray-300 mt-1 mb-4">Add funds to get started</p>
                      <motion.button
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setFundOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Add Funds
                      </motion.button>
                    </>
                  )}
                </div>
              ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="show">
                  {Object.entries(grouped).map(([dateLabel, txs]) => (
                    <div key={dateLabel}>
                      {/* Date group header */}
                      <div className="flex items-center gap-2 pt-5 pb-2">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{dateLabel}</span>
                        <div className="flex-1 h-px bg-gray-100" />
                      </div>

                      {txs.map((tx) => {
                        const cfg    = TX_CONFIG[tx.type] ?? TX_CONFIG.FEE;
                        const TxIcon = cfg.icon;
                        const isIn   = cfg.sign === "+";
                        const time   = new Date(tx.createdAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
                        return (
                          <motion.div
                            key={tx.id}
                            variants={rowVariants}
                            className="flex items-center gap-3 sm:gap-4 py-3 border-b border-gray-50 last:border-0"
                          >
                            <div className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center flex-shrink-0", cfg.bg)}>
                              <TxIcon className={cn("w-4 h-4", cfg.iconColor)} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-800 leading-tight">{cfg.label}</p>
                                {tx.status === "PENDING" && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-[10px] font-bold leading-none">
                                    <Clock className="w-2 h-2" /> Pending
                                  </span>
                                )}
                                {tx.status === "FAILED" && (
                                  <span className="inline-flex px-1.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-400 text-[10px] font-bold leading-none">
                                    Failed
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 truncate mt-0.5">
                                {tx.description ?? `Ref #${tx.id.slice(-8).toUpperCase()}`}
                              </p>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <p className={cn(
                                "text-sm font-black tabular-nums leading-tight",
                                isIn ? "text-emerald-600" : "text-gray-700"
                              )}>
                                {isIn ? "+" : "-"}₦{tx.amount.toLocaleString()}
                              </p>
                              <p className="text-[10px] sm:text-xs text-gray-300 mt-0.5">{time}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* ── Security footer ─────────────────────────── */}
          <div className="flex items-center gap-2.5 px-4 py-3">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <p className="text-xs text-gray-400">
              Secured with 256-bit SSL encryption. Exhubb never stores full card details.
            </p>
          </div>

        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────── */}
      <FundModal
        open={fundOpen}
        onClose={() => setFundOpen(false)}
      />
      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        currentBalance={balance}
        savedBank={savedBank}
      />
    </>
  );
}
