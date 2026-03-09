"use client";

import { useState, useTransition } from "react";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitReviewAction } from "@/lib/actions/orders";

const LABELS = ["Terrible", "Poor", "Okay", "Good", "Excellent"];

export default function WriteReviewForm({
  productId,
  orderId,
  existing,
}: {
  productId: string;
  orderId: string;
  existing?: { rating: number; comment: string | null } | null;
}) {
  const [rating,  setRating]  = useState(existing?.rating ?? 0);
  const [hover,   setHover]   = useState(0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState("");
  const [pending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError("Please select a star rating."); return; }
    setError("");
    const fd = new FormData();
    fd.set("productId", productId);
    fd.set("orderId",   orderId);
    fd.set("rating",    String(rating));
    fd.set("comment",   comment.trim());
    startTransition(async () => {
      const res = await submitReviewAction(fd);
      if ("error" in res && res.error) {
        setError(res.error);
      } else {
        setDone(true);
      }
    });
  }

  if (done) {
    return (
      <div className="flex items-center gap-3 py-4 text-green-700 bg-green-50 rounded-xl px-4 border border-green-100">
        <CheckCircle2 className="w-5 h-5 shrink-0" />
        <p className="text-sm font-semibold">
          {existing ? "Review updated!" : "Review submitted!"} Thank you.
        </p>
      </div>
    );
  }

  const display = hover || rating;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Star picker */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Your rating</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(s)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  "w-8 h-8 transition-colors",
                  s <= display
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-200 fill-gray-200"
                )}
              />
            </button>
          ))}
          {display > 0 && (
            <span className="ml-2 text-sm font-semibold text-gray-600">
              {LABELS[display - 1]}
            </span>
          )}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
          Your review <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product…"
          rows={4}
          maxLength={1000}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{comment.length}/1000</p>
      </div>

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition-all disabled:opacity-60"
      >
        {pending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
        ) : existing ? (
          "Update Review"
        ) : (
          "Submit Review"
        )}
      </button>
    </form>
  );
}
