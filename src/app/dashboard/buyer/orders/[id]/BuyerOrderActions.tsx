"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, AlertTriangle, Star, Loader2, AlertCircle, XCircle, MessageSquare, RotateCcw, X,
} from "lucide-react";
import { confirmReceiptAction, openDisputeAction, submitReviewAction, requestRefundAction } from "@/lib/actions/orders";

interface Props {
  orderId: string;
  productId: string | null;
  status: string;
  sellerName: string;
  refundStatus?: string | null;
}

export default function BuyerOrderActions({ orderId, productId, status, sellerName, refundStatus }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Review state
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewDone, setReviewDone] = useState(false);

  // Dispute state
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  // Refund state
  const [showRefund, setShowRefund] = useState(false);
  const [refundReason, setRefundReason] = useState("");

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const res = await confirmReceiptAction(orderId);
      if (res?.error) { setError(res.error); return; }
      setSuccess("Receipt confirmed! Payment has been released to the seller.");
      router.refresh();
    });
  }

  async function handleReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating === 0) { setError("Please select a star rating"); return; }
    setError(null);
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await submitReviewAction(form);
      if (res?.error) { setError(res.error); return; }
      setReviewDone(true);
      setShowReview(false);
      setSuccess("Review submitted! Thank you.");
    });
  }

  function handleDispute() {
    if (!disputeReason.trim()) { setError("Please describe the issue"); return; }
    setError(null);
    startTransition(async () => {
      const res = await openDisputeAction(orderId, disputeReason);
      if (res?.error) { setError(res.error); return; }
      setShowDispute(false);
      setSuccess("Dispute opened. Our team will review within 24 hours.");
      router.refresh();
    });
  }

  function handleRefund() {
    if (!refundReason.trim()) { setError("Please explain why you need a refund"); return; }
    setError(null);
    startTransition(async () => {
      const res = await requestRefundAction(orderId, refundReason);
      if (res?.error) { setError(res.error); return; }
      setShowRefund(false);
      setSuccess("Refund request submitted. The seller will review it within 48 hours.");
      router.refresh();
    });
  }

  if (!["SHIPPED", "DELIVERED", "COMPLETED"].includes(status)) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Actions</h3>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-semibold">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {success}
        </div>
      )}

      {/* Confirm receipt */}
      {["SHIPPED", "DELIVERED"].includes(status) && (
        <div className="space-y-2">
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            I Received My Order ✓
          </button>
          <p className="text-xs text-gray-400 text-center">
            This releases payment to the seller. Auto-releases after 7 days.
          </p>
        </div>
      )}

      {/* Review (after completed) */}
      {status === "COMPLETED" && productId && !reviewDone && (
        <div className="space-y-3">
          <button
            onClick={() => setShowReview((v) => !v)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-sm font-bold rounded-xl border border-yellow-200 transition-colors"
          >
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            Leave a Review
          </button>

          {showReview && (
            <form onSubmit={handleReview} className="space-y-3 pt-1 border-t border-gray-100">
              <input type="hidden" name="productId" value={productId} />
              <input type="hidden" name="orderId"   value={orderId} />
              <input type="hidden" name="rating"    value={rating} />

              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Your Rating *</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          star <= (hoverRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Comment (optional)</label>
                <textarea
                  name="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder={`How was your experience with ${sellerName}?`}
                  className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 resize-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isPending || rating === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                Submit Review
              </button>
            </form>
          )}
        </div>
      )}

      {reviewDone && (
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> Review submitted
        </div>
      )}

      {/* Refund request */}
      {["SHIPPED", "DELIVERED", "COMPLETED"].includes(status) && !refundStatus && (
        <>
          {!showRefund ? (
            <button
              onClick={() => setShowRefund(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Request a refund
            </button>
          ) : (
            <div className="space-y-3 border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold text-orange-600 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Request Refund
              </p>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={3}
                placeholder="Explain why you're requesting a refund…"
                className="w-full px-3.5 py-3 rounded-xl border border-orange-200 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleRefund}
                  disabled={isPending || !refundReason.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  Submit Refund Request
                </button>
                <button
                  onClick={() => setShowRefund(false)}
                  className="px-4 py-2.5 border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {refundStatus === "REQUESTED" && (
        <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-xl text-xs text-orange-700 font-semibold">
          <RotateCcw className="w-3.5 h-3.5" /> Refund request pending seller review
        </div>
      )}
      {refundStatus === "APPROVED" && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl text-xs text-green-700 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" /> Refund approved — check your wallet
        </div>
      )}
      {refundStatus === "REJECTED" && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl text-xs text-red-600 font-semibold">
          <X className="w-3.5 h-3.5" /> Refund request rejected — you may open a dispute
        </div>
      )}

      {/* Dispute */}
      {["SHIPPED", "DELIVERED", "COMPLETED"].includes(status) && !showDispute && (
        <button
          onClick={() => setShowDispute(true)}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5" /> Report an issue / open dispute
        </button>
      )}

      {showDispute && (
        <div className="space-y-3 border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold text-red-600 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Open a Dispute
          </p>
          <textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            rows={3}
            placeholder="Describe the issue: item not received, damaged item, wrong product…"
            className="w-full px-3.5 py-3 rounded-xl border border-red-200 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleDispute}
              disabled={isPending || !disputeReason.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
              Submit Dispute
            </button>
            <button
              onClick={() => setShowDispute(false)}
              className="px-4 py-2.5 border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
