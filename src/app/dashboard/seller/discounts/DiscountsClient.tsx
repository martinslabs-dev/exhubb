"use client";

import { useState, useTransition } from "react";
import { Ticket, Plus, Loader2, Trash2, ToggleLeft, ToggleRight, Tag, Percent, Banknote, CheckCircle2, X } from "lucide-react";
import {
  createDiscountCodeAction,
  toggleDiscountCodeAction,
  deleteDiscountCodeAction,
} from "@/lib/actions/discount";

interface DiscountCode {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FLAT";
  value: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
}

export default function DiscountsClient({ codes }: { codes: DiscountCode[] }) {
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [list, setList] = useState(codes);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createDiscountCodeAction(form);
      if (result?.error) {
        setErrors({ submit: result.error });
      } else {
        setSuccess(true);
        setTimeout(() => { setShowForm(false); setSuccess(false); }, 1200);
        // Refresh via window
        (e.currentTarget as HTMLFormElement).reset();
      }
    });
  }

  async function handleToggle(id: string, isActive: boolean) {
    startTransition(async () => {
      await toggleDiscountCodeAction(id, !isActive);
      setList((prev) => prev.map((c) => c.id === id ? { ...c, isActive: !isActive } : c));
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this discount code?")) return;
    startTransition(async () => {
      await deleteDiscountCodeAction(id);
      setList((prev) => prev.filter((c) => c.id !== id));
    });
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Discount Codes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage coupon codes for your store.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setErrors({}); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors"
        >
          <Plus className="w-4 h-4" /> New Code
        </button>
      </div>

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
            <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary-600" /> Create Discount Code
            </h2>

            {success && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <p className="text-sm font-semibold text-green-700">Code created!</p>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Code *</label>
                <input
                  name="code"
                  placeholder="e.g. WELCOME20"
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm uppercase font-mono outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </div>

              {/* Type + Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Type *</label>
                  <select
                    name="type"
                    defaultValue="PERCENTAGE"
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:border-primary-400"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat (₦)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Value *</label>
                  <input
                    name="value"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 20"
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>

              {/* Min order + Max uses */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Min Order (₦)</label>
                  <input
                    name="minOrderAmount"
                    type="number"
                    min="0"
                    placeholder="Optional"
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Max Uses</label>
                  <input
                    name="maxUses"
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400"
                  />
                </div>
              </div>

              {/* Expires at */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Expires At</label>
                <input
                  name="expiresAt"
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400"
                />
              </div>

              {errors.submit && (
                <p className="text-xs text-red-500">{errors.submit}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-bold transition-colors"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {isPending ? "Creating…" : "Create Code"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Empty state */}
      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Ticket className="w-12 h-12 text-gray-100 mx-auto mb-4" />
          <h3 className="text-base font-bold text-gray-700 mb-1">No discount codes yet</h3>
          <p className="text-sm text-gray-400 mb-4">Create codes to offer discounts to your buyers.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors"
          >
            <Plus className="w-4 h-4" /> Create First Code
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((code) => {
            const isExpired = code.expiresAt ? code.expiresAt < new Date() : false;
            const isFull = code.maxUses != null && code.usedCount >= code.maxUses;

            return (
              <div key={code.id} className={`bg-white rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${!code.isActive || isExpired || isFull ? "opacity-60" : "border-gray-100"}`}>
                {/* Code type icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${code.type === "PERCENTAGE" ? "bg-purple-50" : "bg-green-50"}`}>
                  {code.type === "PERCENTAGE"
                    ? <Percent className="w-5 h-5 text-purple-600" />
                    : <Banknote className="w-5 h-5 text-green-600" />
                  }
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded-lg">{code.code}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${code.type === "PERCENTAGE" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}>
                      {code.type === "PERCENTAGE" ? `${code.value}% off` : `₦${code.value.toLocaleString()} off`}
                    </span>
                    {isExpired && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Expired</span>}
                    {isFull    && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">Limit reached</span>}
                    {!code.isActive && !isExpired && !isFull && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Disabled</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-400">
                    <span>{code.usedCount}{code.maxUses ? `/${code.maxUses}` : ""} uses</span>
                    {code.minOrderAmount && <span>Min ₦{code.minOrderAmount.toLocaleString()}</span>}
                    {code.expiresAt && <span>Expires {new Date(code.expiresAt).toLocaleDateString()}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(code.id, code.isActive)}
                    disabled={isPending}
                    className="p-2 rounded-xl hover:bg-gray-50 transition-colors"
                    title={code.isActive ? "Disable" : "Enable"}
                  >
                    {code.isActive
                      ? <ToggleRight className="w-5 h-5 text-primary-600" />
                      : <ToggleLeft className="w-5 h-5 text-gray-400" />
                    }
                  </button>
                  <button
                    onClick={() => handleDelete(code.id)}
                    disabled={isPending}
                    className="p-2 rounded-xl hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
