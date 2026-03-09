"use client";

import { useActionState, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Eye, EyeOff, ArrowRight, Loader2, AlertCircle, Lock,
} from "lucide-react";
import { signInAction } from "@/lib/actions/auth";

// ── Framer Motion variants ────────────────────────────────────
const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const itemVariants: Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

// ── Floating-label input ──────────────────────────────────────
function Field({
  id, name, type, label, autoComplete, placeholder, extra,
}: {
  id: string; name: string; type: string; label: string;
  autoComplete?: string; placeholder?: string;
  extra?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const [value,   setValue]   = useState("");
  const [show,    setShow]    = useState(false);
  const isPassword = type === "password";
  const inputType  = isPassword ? (show ? "text" : "password") : type;
  const float      = focused || value.length > 0;

  return (
    <motion.div variants={itemVariants}>
      <div className="relative">
        <motion.label
          htmlFor={id}
          animate={{
            top:      float ? "8px"  : "50%",
            fontSize: float ? "11px" : "14px",
            color:    focused ? "#16a34a" : "#9ca3af",
          }}
          transition={{ duration: 0.18 }}
          className="absolute left-4 -translate-y-1/2 pointer-events-none font-medium z-10 origin-left"
          style={{ top: "50%", fontSize: "14px" }}
        >
          {label}
        </motion.label>

        <input
          id={id}
          name={name}
          type={inputType}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={float ? (placeholder ?? "") : ""}
          required
          className={`w-full h-14 px-4 pt-5 pb-2 rounded-xl border-2 bg-white text-sm text-gray-900 outline-none transition-colors duration-150 ${
            focused ? "border-primary-500 shadow-sm shadow-primary-100" : "border-gray-200 hover:border-gray-300"
          } ${isPassword ? "pr-12" : ""}`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={show ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {extra}
    </motion.div>
  );
}
// ── Account-lock countdown ────────────────────────────────────────────
function LockCountdown({ lockedUntil }: { lockedUntil: number }) {
  const [secs, setSecs] = useState(() =>
    Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000))
  );

  useEffect(() => {
    const calc = () => Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
    if (calc() === 0) return;
    const id = setInterval(() => {
      const next = calc();
      setSecs(next);
      if (next === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const min   = Math.floor(secs / 60);
  const sec   = secs % 60;
  const done  = secs === 0;
  const total = 5 * 60; // 5-minute lock

  return (
    <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
      <div className="px-4 py-3">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-sm font-bold text-amber-800">
            {done ? "You can try signing in again." : "Account temporarily locked"}
          </p>
        </div>

        {!done ? (
          <>
            <p className="text-xs text-amber-600 mb-3 ml-[2.375rem]">
              Too many failed attempts. Try again in:
            </p>
            <div className="flex items-center gap-3 ml-[2.375rem]">
              {/* MM:SS display */}
              <div className="flex items-center bg-amber-100 rounded-lg px-3 py-1.5">
                <span className="font-mono text-2xl font-black text-amber-800 tabular-nums">
                  {String(min).padStart(2, "0")}
                </span>
                <span className="font-mono text-xl font-black text-amber-400 mx-1">:</span>
                <span className="font-mono text-2xl font-black text-amber-800 tabular-nums">
                  {String(sec).padStart(2, "0")}
                </span>
              </div>
              {/* Draining progress bar */}
              <div className="flex-1 h-2 bg-amber-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-amber-400 rounded-full"
                  animate={{ width: `${(secs / total) * 100}%` }}
                  transition={{ duration: 0.95, ease: "linear" }}
                />
              </div>
            </div>
          </>
        ) : (
          <p className="text-xs text-amber-600 ml-[2.375rem]">
            Reload the page or try signing in again below.
          </p>
        )}
      </div>
    </div>
  );
}
// ── Main form ─────────────────────────────────────────────────
function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") || "/dashboard";
  const urlError     = searchParams.get("error");
  const verified     = searchParams.get("verified") === "1";

  const [state, formAction, isPending] = useActionState(signInAction, null);

  const lockedUntil = state?.lockedUntil ?? null;
  const errorMessage =
    (state?.error && state.error !== "account-locked")
      ? state.error
      : urlError === "CredentialsSignin" ? "Incorrect email or password." : null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      {/* Heading */}
      <motion.div variants={itemVariants} className="mb-7">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Welcome back</h1>
        <p className="mt-1.5 text-sm text-gray-500">Sign in to your Exhubb account</p>
      </motion.div>

      {/* Verified success banner */}
      <AnimatePresence>
        {verified && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm overflow-hidden"
          >
            <span className="text-base">✓</span>
            <span>Email verified! Sign in to continue.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lock countdown */}
      <AnimatePresence>
        {lockedUntil && (
          <motion.div
            key="lock"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <LockCountdown lockedUntil={lockedUntil} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error banner */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            key="err"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0, x: [0, -10, 10, -8, 8, -4, 0] }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ opacity: { duration: 0.2 }, y: { duration: 0.2 } }}
            className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        <Field
          id="email" name="email" type="email" label="Email address"
          autoComplete="email" placeholder="you@example.com"
        />

        <Field
          id="password" name="password" type="password" label="Password"
          autoComplete="current-password" placeholder="Your password"
          extra={
            <div className="mt-2 text-right">
              <Link
                href="/forgot-password"
                className="text-xs text-primary-600 hover:text-primary-700 font-semibold transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          }
        />

        <motion.div variants={itemVariants} className="pt-1">
          <motion.button
            type="submit"
            disabled={isPending}
            whileHover={{ scale: isPending ? 1 : 1.015 }}
            whileTap={{ scale: isPending ? 1 : 0.97 }}
            className="w-full h-12 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>Sign in <ArrowRight className="w-4 h-4" /></>
            )}
          </motion.button>
        </motion.div>
      </form>

      {/* Register link */}
      <motion.div variants={itemVariants} className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
          Create one free
        </Link>
      </motion.div>

      <motion.p variants={itemVariants} className="mt-4 text-center text-xs text-gray-400">
        Protected by industry-standard encryption.{" "}
        <Link href="/privacy" className="underline hover:text-gray-600 transition-colors">
          Privacy policy
        </Link>
      </motion.p>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

