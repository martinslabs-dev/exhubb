"use client";

import { useActionState, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Loader2, AlertCircle, CheckCircle2, ArrowRight, RefreshCw, MessageCircle,
} from "lucide-react";
import { verifyPhoneOtpAction, addPhoneAction } from "@/lib/actions/otp";

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

function VerifyPhoneForm() {
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";
  const mode  = searchParams.get("mode")  ?? "";   // "add" = already signed in
  const login = searchParams.get("login") ?? "0";  // legacy phone-login mode

  const [verifyState, verifyAction, verifyPending] = useActionState(verifyPhoneOtpAction, null);
  const [resendState, resendAction, resendPending] = useActionState(addPhoneAction, null);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);

  function handleDigit(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      document.getElementById("otp-5")?.focus();
    }
  }

  const code = digits.join("");
  const backHref = mode === "add" ? "/add-phone" : (login === "1" ? "/login" : "/register");

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
        className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-5"
      >
        <motion.div
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <MessageCircle className="w-7 h-7 text-green-600" />
        </motion.div>
      </motion.div>

      {/* Heading */}
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Check your WhatsApp</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          We sent a 6-digit code to{" "}
          <span className="font-semibold text-gray-800">{phone || "your phone"}</span>
        </p>
      </motion.div>

      {/* Resend success */}
      <AnimatePresence>
        {resendState?.success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 overflow-hidden"
          >
            <div className="flex items-start gap-2.5 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>New code sent to your WhatsApp.</span>
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

      {/* OTP form */}
      <form action={verifyAction} className="space-y-5">
        <input type="hidden" name="phone" value={phone} />
        <input type="hidden" name="code"  value={code}  />
        <input type="hidden" name="mode"  value={mode}  />

        <motion.div variants={itemVariants}>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Enter 6-digit code
          </label>
          <div className="flex gap-2 sm:gap-3" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <motion.input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                whileFocus={{ scale: 1.05, borderColor: "#16a34a" }}
                className={`w-full h-14 text-center text-2xl font-black rounded-xl border-2 bg-white text-gray-900 outline-none transition-colors duration-100 ${
                  d ? "border-green-500 bg-green-50" : "border-gray-200"
                }`}
                autoFocus={i === 0}
              />
            ))}
          </div>
          <p className="mt-2.5 text-xs text-gray-400">
            Code expires in 15 minutes. Make sure your WhatsApp is active.
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <motion.button
            type="submit"
            disabled={verifyPending || code.length < 6}
            whileHover={{ scale: verifyPending || code.length < 6 ? 1 : 1.015 }}
            whileTap={{ scale: 0.97 }}
            className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {verifyPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>Verify phone <ArrowRight className="w-4 h-4" /></>
            )}
          </motion.button>
        </motion.div>
      </form>

      {/* Resend */}
      <motion.div variants={itemVariants} className="mt-5 text-center">
        <p className="text-sm text-gray-400 mb-2">Didn&apos;t receive it?</p>
        <form action={resendAction} className="inline">
          <input type="hidden" name="phone" value={phone} />
          <button
            type="submit"
            disabled={resendPending}
            className="text-sm font-semibold text-green-600 hover:text-green-700 flex items-center gap-1.5 mx-auto transition-colors disabled:opacity-60"
          >
            {resendPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Resend to WhatsApp
          </button>
        </form>
      </motion.div>

      {/* Back link */}
      <motion.div variants={itemVariants} className="mt-4 text-center">
        <Link
          href={backHref}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
        >
          Wrong number? Go back
        </Link>
      </motion.div>
    </motion.div>
  );
}

export default function VerifyPhonePage() {
  return (
    <Suspense>
      <VerifyPhoneForm />
    </Suspense>
  );
}

