"use client";

import { useActionState, useState, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Eye, EyeOff, ArrowRight, Loader2, AlertCircle, Check,
  ShoppingBag, Package, Briefcase, Users,
} from "lucide-react";
import { signUpAction } from "@/lib/actions/auth";

// ── Variants ──────────────────────────────────────────────────
const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const itemVariants: Variants = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: "easeOut" } },
};
const shakeVariants: Variants = {
  shake: { x: [0, -10, 10, -8, 8, -4, 0], transition: { duration: 0.45 } },
};

// ── Intent options ────────────────────────────────────────────
const INTENTS = [
  { id: "buyer",      icon: ShoppingBag, label: "Buy products",    desc: "Shop from sellers worldwide" },
  { id: "seller",     icon: Package,     label: "Sell products",   desc: "List & sell goods online"    },
  { id: "freelancer", icon: Briefcase,   label: "Offer services",  desc: "Get hired for your skills"   },
  { id: "client",     icon: Users,       label: "Hire talent",     desc: "Post jobs & find experts"    },
] as const;
type Intent = (typeof INTENTS)[number]["id"];

// ── Password strength ─────────────────────────────────────────
function strength(pw: string) {
  if (!pw) return { score: 0, label: "", bar: "" };
  let s = 0;
  if (pw.length >= 8)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    { label: "Weak",      bar: "bg-red-500"      },
    { label: "Fair",      bar: "bg-orange-400"   },
    { label: "Good",      bar: "bg-yellow-400"   },
    { label: "Strong",    bar: "bg-primary-500"  },
    { label: "Very strong", bar: "bg-primary-600" },
  ];
  return { score: s, ...map[s] };
}

// ── Floating label input ──────────────────────────────────────
function Field({
  id, name, type, label, autoComplete, placeholder, onChange, hasError, errorText,
}: {
  id: string; name: string; type: string; label: string;
  autoComplete?: string; placeholder?: string;
  onChange?: (v: string) => void;
  hasError?: boolean;
  errorText?: string;
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
            top:      float ? "8px" : "50%",
            fontSize: float ? "11px" : "14px",
            color:    focused ? "#16a34a" : hasError ? "#dc2626" : "#9ca3af",
          }}
          transition={{ duration: 0.18 }}
          className="absolute left-4 -translate-y-1/2 pointer-events-none font-medium z-10"
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
          onChange={(e) => {
            setValue(e.target.value);
            onChange?.(e.target.value);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={float ? (placeholder ?? "") : ""}
          required
          className={`w-full h-14 px-4 pt-5 pb-2 rounded-xl border-2 bg-white text-sm text-gray-900 outline-none transition-colors duration-150 ${
            focused ? "border-primary-500 shadow-sm shadow-primary-100" : hasError ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300"
          } ${isPassword ? "pr-12" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={show ? "Hide" : "Show"}
            tabIndex={-1}
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {errorText && (
        <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {errorText}
        </p>
      )}
    </motion.div>
  );
}

// ── Register form ─────────────────────────────────────────────
function RegisterForm() {
  const searchParams = useSearchParams();
  const urlIntent = searchParams.get("intent") as Intent | null;

  const [intent, setIntent] = useState<Intent>(
    INTENTS.some((i) => i.id === urlIntent) ? (urlIntent as Intent) : "buyer"
  );
  const [pw,          setPw]          = useState("");
  const [agreed,      setAgreed]      = useState(false);
  const [termsError,  setTermsError]  = useState(false);

  const [state, dispatch] = useActionState(signUpAction, null);
  const [isPending, startTransition] = useTransition();
  const pwStrength = strength(pw);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!agreed) {
      setTermsError(true);
      document.getElementById("terms-check")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const formData = new FormData(e.currentTarget);
    startTransition(() => dispatch(formData));
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      {/* Heading */}
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Create account</h1>
        <p className="mt-1.5 text-sm text-gray-500">Free forever · No listing fees to start</p>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {state?.error && (
          <motion.div
            key="err"
            variants={shakeVariants}
            animate="shake"
            initial={{ opacity: 0, y: -8 }}
            className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{state.error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="intent" value={intent} />

        {/* Intent selector */}
        <motion.div variants={itemVariants}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">
            What will you use Exhubb for?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {INTENTS.map(({ id, icon: Icon, label, desc }) => {
              const active = intent === id;
              return (
                <motion.button
                  key={id}
                  type="button"
                  onClick={() => setIntent(id)}
                  whileTap={{ scale: 0.97 }}
                  className={`relative text-left rounded-xl border-2 p-3 transition-all ${
                    active
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {active && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </span>
                  )}
                  <Icon className={`w-4 h-4 mb-1.5 ${active ? "text-primary-600" : "text-gray-400"}`} />
                  <p className={`text-xs font-bold leading-tight ${active ? "text-gray-900" : "text-gray-600"}`}>
                    {label}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{desc}</p>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Fields */}
        <Field id="name" name="name" type="text" label="Full name"
          autoComplete="name" placeholder="Jane Doe" />

        <Field id="email" name="email" type="email" label="Email address"
          autoComplete="email" placeholder="you@example.com"
          hasError={state?.field === "email"}
          errorText={state?.field === "email" ? state.error : undefined} />

        <div className="space-y-1.5">
          <Field id="password" name="password" type="password" label="Password"
            autoComplete="new-password" placeholder="Min. 8 characters"
            onChange={setPw} />

          {/* Strength meter */}
          <AnimatePresence>
            {pw && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-1 mb-1 px-0.5">
                  {[0,1,2,3].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: i < pwStrength.score ? 1 : 0.15 }}
                      transition={{ duration: 0.25, delay: i * 0.04 }}
                      className={`h-1 flex-1 rounded-full origin-left ${i < pwStrength.score ? pwStrength.bar : "bg-gray-200"}`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-semibold ${pwStrength.score <= 1 ? "text-red-500" : pwStrength.score <= 2 ? "text-orange-500" : "text-primary-600"}`}>
                  {pwStrength.label}
                  <span className="ml-1.5 font-normal text-gray-400">
                    · Mix uppercase, numbers & symbols
                  </span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Terms */}
        <motion.div variants={itemVariants}>
          <label id="terms-check" className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => { setAgreed(e.target.checked); setTermsError(false); }}
                className="sr-only"
              />
              <motion.div
                animate={{
                  backgroundColor: agreed ? "#16a34a" : termsError ? "#fee2e2" : "#fff",
                  borderColor:     agreed ? "#16a34a" : termsError ? "#f87171" : "#d1d5db",
                }}
                className="w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center transition-colors"
              >
                {agreed && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
              </motion.div>
            </div>
            <span className="text-xs text-gray-500 leading-relaxed">
              I agree to{" "}
              <Link href="/terms" className="text-primary-600 hover:underline font-semibold">Terms</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-primary-600 hover:underline font-semibold">Privacy Policy</Link>
              . I&apos;ll receive account-related emails.
            </span>
          </label>
          {termsError && (
            <p className="mt-1.5 ml-7 text-xs text-red-500 font-medium">
              Please accept the terms to continue.
            </p>
          )}
        </motion.div>

        {/* Submit */}
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
              <>Create account <ArrowRight className="w-4 h-4" /></>
            )}
          </motion.button>
        </motion.div>
      </form>

      {/* Login link */}
      <motion.div variants={itemVariants} className="mt-5 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
          Sign in
        </Link>
      </motion.div>
    </motion.div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

