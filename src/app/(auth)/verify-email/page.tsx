"use client";

import { useActionState, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Loader2, Mail, AlertCircle, CheckCircle2, ArrowRight, RefreshCw,
} from "lucide-react";
import { verifyEmailAction, resendOtpAction } from "@/lib/actions/otp";

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const itemVariants: Variants = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: "easeOut" } },
};
const shakeVariants: Variants = {
  shake: { x: [0, -10, 10, -8, 8, -4, 0], transition: { duration: 0.45 } },
};

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const email  = searchParams.get("email")  ?? "";
  const resent = searchParams.get("resent") === "1";

  const [verifyState, verifyAction, verifyPending] = useActionState(verifyEmailAction, null);
  const [resendState, resendAction, resendPending]  = useActionState(resendOtpAction, null);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);

  function handleDigit(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) {
      document.getElementById(`otp-e-${index + 1}`)?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      document.getElementById(`otp-e-${index - 1}`)?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      document.getElementById("otp-e-5")?.focus();
    }
  }

  const code = digits.join("");

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      {/* Icon */}
      <motion.div
        variants={itemVariants}
        className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-5"
      >
        <motion.div
          animate={{ rotate: [0, -8, 8, -4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Mail className="w-7 h-7 text-primary-600" />
        </motion.div>
      </motion.div>

      {/* Heading */}
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Check your email</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          We sent a 6-digit code to{" "}
          <span className="font-semibold text-gray-800">{email || "your email"}</span>
        </p>
      </motion.div>

      {/* Resent banner */}
      <AnimatePresence>
        {(resent || resendState?.success) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 overflow-hidden"
          >
            <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{resendState?.success ?? "A new code has been sent."}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {verifyState?.error && (
          <motion.div
            key="err"
            variants={shakeVariants}
            animate="shake"
            initial={{ opacity: 0, y: -8 }}
            className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{verifyState.error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OTP boxes */}
      <form action={verifyAction} className="space-y-5">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="code"  value={code}  />

        <motion.div variants={itemVariants}>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Enter 6-digit code
          </label>
          <div className="flex gap-2 sm:gap-3" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <motion.input
                key={i}
                id={`otp-e-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                whileFocus={{ scale: 1.05, borderColor: "#16a34a" }}
                className={`w-full h-14 text-center text-2xl font-black rounded-xl border-2 bg-white text-gray-900 outline-none transition-colors duration-100 ${
                  d ? "border-primary-500 bg-primary-50" : "border-gray-200"
                }`}
                autoFocus={i === 0}
              />
            ))}
          </div>
          <p className="mt-2.5 text-xs text-gray-400">
            Code expires in 15 minutes. Check your spam folder if you don&apos;t see it.
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <motion.button
            type="submit"
            disabled={verifyPending || code.length < 6}
            whileHover={{ scale: verifyPending || code.length < 6 ? 1 : 1.015 }}
            whileTap={{ scale: 0.97 }}
            className="w-full h-12 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {verifyPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>Verify email <ArrowRight className="w-4 h-4" /></>
            )}
          </motion.button>
        </motion.div>
      </form>

      {/* Resend */}
      <motion.div variants={itemVariants} className="mt-5 text-center">
        <p className="text-sm text-gray-400 mb-2">Didn&apos;t receive it?</p>
        <form action={resendAction} className="inline">
          <input type="hidden" name="email" value={email} />
          <button
            type="submit"
            disabled={resendPending}
            className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1.5 mx-auto transition-colors disabled:opacity-60"
          >
            {resendPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Resend code
          </button>
        </form>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-4 text-center">
        <Link href="/register" className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2">
          Wrong email? Start over
        </Link>
      </motion.div>
    </motion.div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}

