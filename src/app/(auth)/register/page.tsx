"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Mail,
  Phone,
  ArrowRight,
  Loader2,
  ShoppingBag,
  Package,
  Briefcase,
  Users,
  Check,
  AlertCircle,
} from "lucide-react";
import { signUpAction } from "@/lib/actions/auth";

// ─── OAuth icons ─────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h13.2c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.7-4.3 7.3-10.7 7.3-17.3z"/>
      <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.8l-7.9-6c-2.2 1.5-5 2.3-8.1 2.3-6.2 0-11.5-4.2-13.4-9.9H2.4v6.2C6.4 42.5 14.7 48 24 48z"/>
      <path fill="#FBBC05" d="M10.6 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6v-6.2H2.4A23.9 23.9 0 0 0 0 24c0 3.9.9 7.6 2.4 10.8l8.2-6.2z"/>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.8-6.8C35.9 2.4 30.4 0 24 0 14.7 0 6.4 5.5 2.4 13.2l8.2 6.2C12.5 13.7 17.8 9.5 24 9.5z"/>
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#1877F2" d="M24 12a12 12 0 1 0-13.875 11.86V15.47H7.078V12h3.047v-2.64c0-3.007 1.79-4.668 4.533-4.668 1.312 0 2.686.234 2.686.234v2.953h-1.514c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.469h-2.796v8.39A12 12 0 0 0 24 12z"/>
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

// ─── Intent options ───────────────────────────────────────────
const INTENTS = [
  {
    id: "buyer",
    icon: ShoppingBag,
    label: "Shop & Buy",
    description: "Browse products and services",
    color: "green",
  },
  {
    id: "seller",
    icon: Package,
    label: "Sell Products",
    description: "List & sell physical or digital goods",
    color: "green",
  },
  {
    id: "freelancer",
    icon: Briefcase,
    label: "Offer Services",
    description: "Freelance & get hired for your skills",
    color: "gold",
  },
  {
    id: "client",
    icon: Users,
    label: "Hire Talent",
    description: "Post jobs and find skilled freelancers",
    color: "gold",
  },
] as const;

type Intent = (typeof INTENTS)[number]["id"];

// ─── Password strength ────────────────────────────────────────
function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    { label: "Weak", color: "bg-red-500" },
    { label: "Fair", color: "bg-gold-500" },
    { label: "Good", color: "bg-gold-400" },
    { label: "Strong", color: "bg-primary-500" },
    { label: "Very strong", color: "bg-primary-600" },
  ];
  return { score: s, ...map[s] };
}

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const urlIntent = searchParams.get("intent") as Intent | null;

  const [intent, setIntent] = useState<Intent>(
    INTENTS.some((i) => i.id === urlIntent) ? (urlIntent as Intent) : "buyer"
  );
  const [tab, setTab] = useState<"email" | "phone">("email");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const [state, formAction, isPending] = useActionState(signUpAction, null);
  const strength = getStrength(password);

  async function handleOAuth(provider: string) {
    setOauthLoading(provider);
    await signIn(provider, { callbackUrl: "/dashboard" });
  }

  return (
    <div className="w-full max-w-lg">
      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Free forever · No listing fees to start
          </p>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Error banner */}
          {state?.error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          {/* ── Intent picker ── */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              What brings you to Exhubb?
              <span className="ml-1.5 text-xs font-normal text-gray-400">
                (you can add more roles later)
              </span>
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {INTENTS.map(({ id, icon: Icon, label, description, color }) => {
                const active = intent === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setIntent(id)}
                    className={`relative text-left rounded-xl border-2 p-3.5 transition-all ${
                      active
                        ? color === "green"
                          ? "border-primary-600 bg-primary-50"
                          : "border-gold-500 bg-gold-50"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {/* Check indicator */}
                    {active && (
                      <span
                        className={`absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center ${
                          color === "green" ? "bg-primary-600" : "bg-gold-500"
                        }`}
                      >
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </span>
                    )}
                    <Icon
                      className={`w-5 h-5 mb-2 ${
                        active
                          ? color === "green"
                            ? "text-primary-600"
                            : "text-gold-600"
                          : "text-gray-400"
                      }`}
                    />
                    <p
                      className={`text-xs font-bold leading-tight ${
                        active ? "text-gray-900" : "text-gray-600"
                      }`}
                    >
                      {label}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                      {description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── OAuth ── */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-60"
            >
              {oauthLoading === "google" ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
              Continue with Google
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleOAuth("facebook")}
                disabled={!!oauthLoading}
                className="flex items-center justify-center gap-2.5 h-11 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-60"
              >
                {oauthLoading === "facebook" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FacebookIcon />}
                Facebook
              </button>
              <button
                type="button"
                onClick={() => handleOAuth("twitter")}
                disabled={!!oauthLoading}
                className="flex items-center justify-center gap-2.5 h-11 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-60"
              >
                {oauthLoading === "twitter" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XIcon />}
                X (Twitter)
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400 font-medium">
                or fill in your details
              </span>
            </div>
          </div>

          {/* ── Form ── */}
          <form action={formAction} className="space-y-4">
            {/* Pass the selected intent as a hidden field */}
            <input type="hidden" name="intent" value={intent} />
            {/* Full name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="Jane Doe"
                className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              />
            </div>

            {/* Email / Phone toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">
                  {tab === "email" ? "Email address" : "Phone number"}
                </label>
                <button
                  type="button"
                  onClick={() => setTab(tab === "email" ? "phone" : "email")}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors"
                >
                  {tab === "email" ? (
                    <><Phone className="w-3 h-3" /> Use phone instead</>
                  ) : (
                    <><Mail className="w-3 h-3" /> Use email instead</>
                  )}
                </button>
              </div>

              {tab === "email" ? (
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              ) : (
                <div className="flex gap-2">
                  <select className="h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition shrink-0">
                    <option>🇺🇸 +1</option>
                    <option>🇬🇧 +44</option>
                    <option>🇳🇬 +234</option>
                    <option>🇿🇦 +27</option>
                    <option>🇬🇭 +233</option>
                    <option>🇰🇪 +254</option>
                    <option>🇮🇳 +91</option>
                  </select>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    placeholder="800 000 0000"
                    className="flex-1 h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  />
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="reg-password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-3.5 pr-11 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Strength meter */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i < strength.score ? strength.color : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${
                    strength.score <= 1 ? "text-red-500" :
                    strength.score <= 2 ? "text-gold-600" :
                    "text-primary-600"
                  }`}>
                    {strength.label}
                    <span className="ml-1.5 font-normal text-gray-400">
                      Use uppercase, numbers & symbols to strengthen it
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-4.5 h-4.5 rounded flex items-center justify-center border-2 transition-colors ${
                    agreed
                      ? "bg-primary-600 border-primary-600"
                      : "border-gray-300 group-hover:border-gray-400"
                  }`}
                  style={{ width: 18, height: 18 }}
                >
                  {agreed && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
              </div>
              <span className="text-xs text-gray-500 leading-relaxed">
                I agree to Exhubb&apos;s{" "}
                <Link href="/terms" className="text-primary-600 hover:underline font-medium">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary-600 hover:underline font-medium">
                  Privacy Policy
                </Link>
                . I&apos;ll receive account-related emails.
              </span>
            </label>

            <button
              type="submit"
              disabled={isPending || !agreed}
              className="w-full h-11 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-gray-400">
        Protected by industry-standard encryption.{" "}
        <Link href="/privacy" className="underline hover:text-gray-600 transition-colors">
          Privacy policy
        </Link>
      </p>
    </div>
  );
}
