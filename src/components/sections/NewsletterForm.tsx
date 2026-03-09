"use client";

import { useActionState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { subscribeNewsletterAction } from "@/lib/actions/newsletter";

export default function NewsletterForm() {
  const [state, formAction, isPending] = useActionState(subscribeNewsletterAction, null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clear the input on success
  useEffect(() => {
    if (state?.success && inputRef.current) {
      inputRef.current.value = "";
    }
  }, [state?.success]);

  return (
    <form action={formAction} className="w-full md:w-auto">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
        <input
          ref={inputRef}
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          className="flex-1 sm:w-56 bg-white/[0.06] border border-white/[0.08] focus:border-primary-700/50 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 transition-colors"
        />
        <motion.button
          type="submit"
          disabled={isPending}
          whileHover={{ scale: isPending ? 1 : 1.04 }}
          whileTap={{ scale: isPending ? 1 : 0.97 }}
          className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Subscribe"
          )}
        </motion.button>
      </div>

      {/* Feedback */}
      {state?.success && (
        <p className="flex items-center gap-1.5 mt-2.5 text-xs text-primary-400">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          {state.success}
        </p>
      )}
      {state?.error && (
        <p className="flex items-center gap-1.5 mt-2.5 text-xs text-red-400">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {state.error}
        </p>
      )}
    </form>
  );
}
