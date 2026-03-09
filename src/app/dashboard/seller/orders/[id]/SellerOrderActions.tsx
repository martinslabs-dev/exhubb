"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, XCircle, Truck, Loader2, AlertCircle, ChevronDown, ChevronUp, RotateCcw, X,
} from "lucide-react";
import {
  acceptOrderAction,
  cancelOrderAction,
  markShippedAction,
  processRefundAction,
} from "@/lib/actions/orders";

const COURIERS: Record<string, string[]> = {
  NIGERIA:       ["GIG Logistics", "Sendbox", "Kwik Delivery", "DHL Nigeria", "Other"],
  AFRICA:        ["DHL Express", "Aramex Africa", "Sendbox Cross-Border", "Other"],
  INTERNATIONAL: ["DHL", "FedEx", "UPS", "Aramex", "Other"],
  DEFAULT:       ["GIG Logistics", "DHL", "Sendbox", "FedEx", "UPS", "Aramex", "Other"],
};

interface Props {
  orderId: string;
  status: string;
  courierName: string;
  refundStatus?: string | null;
  refundReason?: string | null;
}

export default function SellerOrderActions({ orderId, status, courierName, refundStatus, refundReason }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showShipForm, setShowShipForm] = useState(status === "CONFIRMED" || status === "IN_PROGRESS");
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  async function handleAccept() {
    setError(null);
    startTransition(async () => {
      const res = await acceptOrderAction(orderId);
      if (res?.error) { setError(res.error); return; }
      router.refresh();
    });
  }

  async function handleCancel() {
    if (!cancelReason.trim()) { setError("Please provide a reason for cancellation"); return; }
    setError(null);
    startTransition(async () => {
      const res = await cancelOrderAction(orderId, cancelReason);
      if (res?.error) { setError(res.error); return; }
      router.refresh();
    });
  }

  async function handleShip(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await markShippedAction(form);
      if (res?.error) { setError(res.error); return; }
      router.refresh();
    });
  }

  const couriersForZone = COURIERS.DEFAULT;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Actions</h2>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* ── PENDING: Accept or Cancel ─────────────────── */}
      {status === "PENDING" && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <button
              onClick={handleAccept}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Accept Order
            </button>
            <button
              onClick={() => setShowCancelForm((v) => !v)}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl border border-red-200 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Cancel
              {showCancelForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showCancelForm && (
            <div className="space-y-2 pt-1">
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (shown to buyer)…"
                rows={2}
                className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 resize-none transition-all"
              />
              <button
                onClick={handleCancel}
                disabled={isPending || !cancelReason.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Confirm Cancellation
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── CONFIRMED / IN_PROGRESS: Ship form ────────── */}
      {(status === "CONFIRMED" || status === "IN_PROGRESS") && (
        <div className="space-y-3">
          <button
            onClick={() => setShowShipForm((v) => !v)}
            className="flex items-center gap-2 text-sm font-bold text-primary-700"
          >
            <Truck className="w-4 h-4" />
            {showShipForm ? "Hide" : "Show"} Shipping Form
            {showShipForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showShipForm && (
            <form onSubmit={handleShip} className="space-y-3 pt-1">
              <input type="hidden" name="orderId" value={orderId} />

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Courier *</label>
                <select
                  name="courierName"
                  defaultValue={courierName || ""}
                  required
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white"
                >
                  <option value="">Select courier…</option>
                  {couriersForZone.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tracking Number *</label>
                  <input
                    name="trackingNumber"
                    required
                    placeholder="e.g. GG123456789NG"
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Est. Days</label>
                  <input
                    name="estimatedDays"
                    type="number"
                    min="1"
                    placeholder="3"
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tracking URL (optional)</label>
                <input
                  name="trackingUrl"
                  type="url"
                  placeholder="https://track.giglogistics.com/…"
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                Mark as Shipped
              </button>
            </form>
          )}

          {/* Also allow cancellation from confirmed */}
          {!showCancelForm && (
            <button
              onClick={() => setShowCancelForm((v) => !v)}
              className="text-xs text-red-500 hover:text-red-600 underline"
            >
              Cancel this order
            </button>
          )}
          {showCancelForm && (
            <div className="space-y-2">
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation…"
                rows={2}
                className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-300 resize-none"
              />
              <button
                onClick={handleCancel}
                disabled={isPending || !cancelReason.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Confirm Cancellation
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── SHIPPED / DELIVERED: waiting for buyer ──── */}
      {(status === "SHIPPED" || status === "DELIVERED") && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm">
          <p className="font-semibold text-amber-700">Waiting for buyer confirmation</p>
          <p className="text-amber-600 text-xs mt-0.5">
            Payment will be released when the buyer confirms receipt or after 7 days.
          </p>
        </div>
      )}

      {/* ── Refund Request Management ─────────────────── */}
      {refundStatus === "REQUESTED" && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-bold text-orange-700">Refund Requested</span>
          </div>
          {refundReason && (
            <div className="bg-orange-50 rounded-xl px-3 py-2.5 text-sm text-orange-800">
              <span className="font-semibold">Reason: </span>{refundReason}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => {
                startTransition(async () => {
                  const res = await processRefundAction(orderId, true);
                  if (res?.error) { setError(res.error); return; }
                  router.refresh();
                });
              }}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Approve Refund
            </button>
            <button
              onClick={() => {
                startTransition(async () => {
                  const res = await processRefundAction(orderId, false);
                  if (res?.error) { setError(res.error); return; }
                  router.refresh();
                });
              }}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl border border-red-200 transition-colors"
            >
              <X className="w-4 h-4" /> Reject
            </button>
          </div>
        </div>
      )}

      {refundStatus === "APPROVED" && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2.5 text-sm text-green-700 font-semibold">
          <CheckCircle2 className="w-4 h-4" /> Refund approved — amount deducted from wallet
        </div>
      )}

      {refundStatus === "REJECTED" && (
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-500">
          <X className="w-4 h-4" /> Refund request rejected
        </div>
      )}
    </div>
  );
}
