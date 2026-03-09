"use client";

import { useTransition, useRef, useState } from "react";
import { requestWithdrawalAction } from "@/lib/actions/orders";
import { CreditCard, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  walletBalance: number;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
}

export default function WithdrawalForm({
  walletBalance,
  bankName,
  bankAccountName,
  bankAccountNumber,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const hasBankInfo = bankName && bankAccountName && bankAccountNumber;
  const MIN = 5000;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amount = parseFloat(fd.get("amount") as string);
    if (isNaN(amount) || amount < MIN) {
      setError(`Minimum withdrawal is ₦${MIN.toLocaleString()}`);
      return;
    }
    if (amount > walletBalance) {
      setError("Amount exceeds available balance");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await requestWithdrawalAction(fd);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        formRef.current?.reset();
      }
    });
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
        <p className="text-sm font-bold text-gray-800">Withdrawal request submitted!</p>
        <p className="text-xs text-gray-500">Your payout will be processed within 1–3 business days.</p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-2 text-xs font-semibold text-primary-600 hover:underline"
        >
          Make another withdrawal
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      {/* Bank info display */}
      {hasBankInfo ? (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm space-y-0.5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Payout Account</p>
          <p className="font-semibold text-gray-800">{bankAccountName}</p>
          <p className="text-gray-500">{bankName}</p>
          <p className="font-mono text-gray-700">
            {/* Mask middle digits: show first 3 and last 3 */}
            {bankAccountNumber.slice(0, 3)}****{bankAccountNumber.slice(-3)}
          </p>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
          No bank account linked.{" "}
          <a href="/dashboard/seller/store" className="font-bold underline">
            Add bank details →
          </a>
        </div>
      )}

      {/* Amount */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Amount (₦) — min ₦{MIN.toLocaleString()}, max ₦{walletBalance.toLocaleString()}
        </label>
        <input
          name="amount"
          type="number"
          min={MIN}
          max={walletBalance}
          step="100"
          placeholder={`${MIN}`}
          required
          disabled={!hasBankInfo || walletBalance < MIN}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-50"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending || !hasBankInfo || walletBalance < MIN}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
        ) : (
          <><CreditCard className="w-4 h-4" /> Request Withdrawal</>
        )}
      </button>
    </form>
  );
}
