import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CreditCard, Building2, PlusCircle, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export const metadata: Metadata = { title: "Payouts | Exhubb" };

// Status badge helper
function StatusBadge({ status }: { status: "completed" | "pending" | "failed" }) {
  const cfg = {
    completed: { label: "Paid",    classes: "bg-emerald-50 text-emerald-700" },
    pending:   { label: "Pending", classes: "bg-amber-50  text-amber-700"   },
    failed:    { label: "Failed",  classes: "bg-red-50    text-red-600"     },
  };
  const { label, classes } = cfg[status];
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${classes}`}>
      {label}
    </span>
  );
}

const MOCK_HISTORY = [
  { id: "p1", date: "Mar 01, 2026", amount: 12500,  method: "Bank Transfer",  status: "completed" as const },
  { id: "p2", date: "Feb 15, 2026", amount: 8750,   method: "Bank Transfer",  status: "completed" as const },
  { id: "p3", date: "Feb 01, 2026", amount: 21000,  method: "Bank Transfer",  status: "pending"   as const },
];

export default async function PayoutsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const totalPaid = MOCK_HISTORY
    .filter((p) => p.status === "completed")
    .reduce((a, b) => a + b.amount, 0);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-2xl mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Payouts</h1>
        <p className="text-sm text-gray-500 mt-1">
          Connect your payout method and track your withdrawal history.
        </p>
      </div>

      {/* ── Payout Summary ────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total Paid Out</p>
          <p className="text-2xl font-black text-gray-900">
            ₦{totalPaid.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Pending Payout</p>
          <p className="text-2xl font-black text-amber-600">
            ₦{MOCK_HISTORY.filter((p) => p.status === "pending").reduce((a, b) => a + b.amount, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* ── Payout Methods ────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">Payout Methods</h2>
          <button className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
            <PlusCircle className="w-4 h-4" />
            Add Method
          </button>
        </div>

        {/* Placeholder — no methods connected */}
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-700 text-sm">No payout method connected</p>
            <p className="text-xs text-gray-400 mt-0.5 max-w-xs">
              Add a bank account or PayPal to receive your earnings.
            </p>
          </div>
          <button className="mt-1 flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-sm">
            <Building2 className="w-4 h-4" />
            Connect Bank Account
          </button>
        </div>

        {/* Coming-soon PayPal */}
        <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-black text-blue-700">PP</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">PayPal</p>
            <p className="text-xs text-gray-400">Instant payouts — available soon</p>
          </div>
          <span className="text-[10px] font-bold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
            Soon
          </span>
        </div>
      </div>

      {/* ── Payout Schedule ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-3">Payout Schedule</h2>
        <div className="space-y-3">
          {[
            { label: "Payout Frequency", value: "Weekly (every Monday)",  icon: Clock        },
            { label: "Minimum Payout",   value: "₦1,000",                 icon: CreditCard   },
            { label: "Processing Time",  value: "1–3 business days",       icon: CheckCircle2 },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-2 bg-amber-50 rounded-xl p-3 border border-amber-100">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Earnings from completed orders are held for <strong>14 days</strong> before becoming available for payout.
          </p>
        </div>
      </div>

      {/* ── Payout History ────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Payout History</h2>
        </div>
        {MOCK_HISTORY.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">No payouts yet</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {MOCK_HISTORY.map(({ id, date, amount, method, status }) => (
              <li key={id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{method}</p>
                  <p className="text-xs text-gray-400">{date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">₦{amount.toLocaleString()}</p>
                  <StatusBadge status={status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}
