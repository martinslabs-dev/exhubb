"use client";

import { useActionState, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, AlertCircle, CheckCircle2, ArrowRight, RefreshCw } from "lucide-react";
import { verifyEmailAction, resendOtpAction } from "@/lib/actions/otp";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const resent = searchParams.get("resent") === "1";

  const [verifyState, verifyAction, verifyPending] = useActionState(verifyEmailAction, null);
  const [resendState, resendAction, resendPending] = useActionState(resendOtpAction, null);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);

  function handleDigit(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    // Auto-focus next box
    if (value && index < 5) {
      const el = document.getElementById(`otp-${index + 1}`);
      el?.focus();
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

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-primary-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Check your email</h1>
          <p className="mt-1 text-sm text-gray-500">
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-gray-700">{email || "your email"}</span>
          </p>
        </div>

        <div className="px-8 py-6 space-y-5">
          {/* Resent banner */}
          {(resent || resendState?.success) && (
            <div className="flex items-start gap-2.5 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{resendState?.success ?? "A new code has been sent."}</span>
            </div>
          )}

          {/* Error */}
          {verifyState?.error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{verifyState.error}</span>
            </div>
          )}

          {/* OTP input boxes */}
          <form action={verifyAction} className="space-y-5">
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="code" value={code} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Enter verification code
              </label>
              <div className="flex gap-2.5" onPaste={handlePaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleDigit(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-full h-14 text-center text-xl font-bold rounded-xl border-2 border-gray-200 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Code expires in 15 minutes. Check your spam folder if you don&apos;t see it.
              </p>
            </div>

            <button
              type="submit"
              disabled={verifyPending || code.length < 6}
              className="w-full h-11 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {verifyPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Verify email <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Resend */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Didn&apos;t receive it?</p>
            <form action={resendAction}>
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
          </div>
        </div>

        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 text-center text-sm text-gray-500">
          Wrong email?{" "}
          <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
            Start over
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
