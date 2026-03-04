"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { forgotPasswordAction } from "@/lib/actions/otp";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, null);

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-amber-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Forgot password?</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter your email and we&apos;ll send a reset code.
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
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-11 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Send reset code <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>

        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 text-center text-sm text-gray-500">
          Remember your password?{" "}
          <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
