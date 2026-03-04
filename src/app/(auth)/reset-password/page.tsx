"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { resetPasswordAction } from "@/lib/actions/otp";

function getStrength(pw: string) {
  if (!pw) return { score: 0, label: "", color: "" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    { label: "Weak", color: "bg-red-500" },
    { label: "Fair", color: "bg-amber-500" },
    { label: "Good", color: "bg-amber-400" },
    { label: "Strong", color: "bg-primary-500" },
    { label: "Very strong", color: "bg-primary-600" },
  ];
  return { score: s, ...map[s] };
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [state, formAction, isPending] = useActionState(resetPasswordAction, null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const strength = getStrength(password);

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Set new password</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter the code we sent to{" "}
            <span className="font-semibold text-gray-700">{email}</span> and choose a new password.
          </p>
        </div>

        <div className="px-8 py-6 space-y-4">
          {state?.error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}
          {state?.success && (
            <div className="flex items-start gap-2.5 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{state.success}</span>
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <input type="hidden" name="email" value={email} />

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1.5">
                6-digit reset code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                placeholder="000000"
                className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 tracking-widest placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                New password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
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
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < strength.score ? strength.color : "bg-gray-200"}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${strength.score <= 1 ? "text-red-500" : strength.score <= 2 ? "text-amber-600" : "text-primary-600"}`}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending || strength.score < 1}
              className="w-full h-11 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Reset password <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>

        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 text-center text-sm text-gray-500">
          <Link href="/forgot-password" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
            Request a new code
          </Link>
          {" · "}
          <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
