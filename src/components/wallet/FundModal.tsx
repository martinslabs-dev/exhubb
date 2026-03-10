"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Plus, Loader2, CheckCircle2, AlertCircle,
  Zap, ArrowRight, ShieldCheck,
} from "lucide-react";

const PRESET_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

interface Props {
  open: boolean;
  onClose: () => void;
}

type Step = "amount" | "loading" | "redirecting";

export default function FundModal({ open, onClose }: Props) {
  const [step,       setStep]       = useState<Step>("amount");
  const [amount,     setAmount]     = useState("");
  const [error,      setError]      = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const numAmount = Number(amount.replace(/,/g, ""));

  function handleAmountInput(val: string) {
    // Allow only digits
    const digits = val.replace(/\D/g, "");
    // Format with commas
    const formatted = digits ? Number(digits).toLocaleString() : "";
    setAmount(formatted);
    setError("");
  }

  async function handleFund() {
    if (!numAmount || numAmount < 100) {
      setError("Minimum top-up is ₦100");
      inputRef.current?.focus();
      return;
    }
    if (numAmount > 5_000_000) {
      setError("Maximum single top-up is ₦5,000,000");
      return;
    }

    setStep("loading");
    setError("");

    try {
      const res = await fetch("/api/flutterwave/initialize", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ amount: numAmount }),
      });
      const data = await res.json() as { paymentLink?: string; error?: string };

      if (!res.ok || !data.paymentLink) {
        setError(data.error ?? "Could not create payment link. Try again.");
        setStep("amount");
        return;
      }

      setStep("redirecting");
      // Short delay so user sees the redirect animation
      setTimeout(() => { window.location.href = data.paymentLink!; }, 900);
    } catch {
      setError("Network error. Check your connection and try again.");
      setStep("amount");
    }
  }

  function handleClose() {
    if (step === "loading" || step === "redirecting") return;
    setStep("amount");
    setAmount("");
    setError("");
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 380 }}
            className="fixed bottom-0 left-0 right-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 pointer-events-none"
          >
            <div className="w-full sm:w-[440px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl pointer-events-auto overflow-y-auto max-h-[92vh] sm:max-h-[85vh]">

              {/* Handle (mobile) */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>

              <AnimatePresence mode="wait">

                {/* ── Amount step ────────────────────────── */}
                {step === "amount" && (
                  <motion.div
                    key="amount"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.22 }}
                    className="p-6"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center">
                          <Plus className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <h2 className="text-lg font-black text-gray-900">Add Funds</h2>
                          <p className="text-xs text-gray-400">Powered by Flutterwave</p>
                        </div>
                      </div>
                      <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>

                    {/* Amount input */}
                    <div className="mb-4">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                        Amount (NGN)
                      </label>
                      <div className={`relative flex items-center rounded-2xl border-2 transition-colors ${
                        error ? "border-red-400" : "border-gray-200 focus-within:border-primary-500"
                      } bg-white`}>
                        <span className="pl-4 text-2xl font-black text-gray-400 select-none">₦</span>
                        <input
                          ref={inputRef}
                          type="text"
                          inputMode="numeric"
                          value={amount}
                          onChange={(e) => handleAmountInput(e.target.value)}
                          placeholder="0"
                          className="flex-1 px-2 py-4 text-3xl font-black text-gray-900 bg-transparent outline-none placeholder-gray-200 w-full"
                        />
                      </div>

                      <AnimatePresence>
                        {error && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-1.5 text-xs text-red-500 font-medium mt-1.5"
                          >
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            {error}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Preset amounts */}
                    <div className="grid grid-cols-3 gap-2 mb-6">
                      {PRESET_AMOUNTS.map((preset) => (
                        <motion.button
                          key={preset}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => { setAmount(preset.toLocaleString()); setError(""); }}
                          className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                            numAmount === preset
                              ? "bg-primary-600 text-white shadow-sm shadow-primary-200"
                              : "bg-gray-50 text-gray-600 hover:bg-primary-50 hover:text-primary-600"
                          }`}
                        >
                          ₦{preset.toLocaleString()}
                        </motion.button>
                      ))}
                    </div>

                    {/* CTA */}
                    <motion.button
                      whileHover={{ scale: numAmount >= 100 ? 1.02 : 1 }}
                      whileTap={{ scale: numAmount >= 100 ? 0.97 : 1 }}
                      onClick={handleFund}
                      disabled={!numAmount || numAmount < 100}
                      className="w-full h-14 rounded-2xl bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-base flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary-200"
                    >
                      Fund ₦{numAmount > 0 ? numAmount.toLocaleString() : "—"}
                      <ArrowRight className="w-5 h-5" />
                    </motion.button>

                    {/* Trust badge */}
                    <div className="flex items-center justify-center gap-1.5 mt-4">
                      <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                      <p className="text-xs text-gray-400">256-bit SSL · PCI DSS compliant</p>
                    </div>
                  </motion.div>
                )}

                {/* ── Loading step ───────────────────────── */}
                {(step === "loading" || step === "redirecting") && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.25 }}
                    className="p-10 flex flex-col items-center text-center"
                  >
                    <div className="relative mb-6">
                      {/* Pulsing ring */}
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-full bg-primary-400"
                      />
                      <div className="relative w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center">
                        {step === "redirecting" ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 12 }}
                          >
                            <Zap className="w-9 h-9 text-primary-600" />
                          </motion.div>
                        ) : (
                          <Loader2 className="w-9 h-9 text-primary-600 animate-spin" />
                        )}
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-gray-900 mb-1">
                      {step === "redirecting" ? "Taking you to payment" : "Preparing your payment"}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {step === "redirecting"
                        ? "You'll be redirected to Flutterwave in a moment..."
                        : "Setting up a secure payment session..."}
                    </p>

                    {/* Progress dots */}
                    <div className="flex items-center gap-1.5 mt-6">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                          className="w-2 h-2 rounded-full bg-primary-400"
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
