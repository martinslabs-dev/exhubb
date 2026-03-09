"use client";
// settings: security form
import { useActionState } from "react";
import { useState } from "react";
import { changePasswordAction } from "@/lib/actions/settings";
import { CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";

export default function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, null);
  const [show, setShow] = useState({ current: false, newPass: false, confirm: false });

  const toggle = (field: keyof typeof show) =>
    setShow((s) => ({ ...s, [field]: !s[field] }));

  return (
    <form action={formAction} className="space-y-4">

      {state?.success && (
        <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Password changed successfully.
        </div>
      )}
      {state && !state.success && state.error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {state.error}
        </div>
      )}

      <PasswordField id="current" name="current" label="Current Password" show={show.current} onToggle={() => toggle("current")} />
      <PasswordField id="new" name="new" label="New Password" hint="At least 8 characters" show={show.newPass} onToggle={() => toggle("newPass")} />
      <PasswordField id="confirm" name="confirm" label="Confirm New Password" show={show.confirm} onToggle={() => toggle("confirm")} />

      <div className="flex justify-end pt-1">
        <button
          type="submit" disabled={pending}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          {pending ? "Updating…" : "Change Password"}
        </button>
      </div>

    </form>
  );
}

function PasswordField({
  id, name, label, hint, show, onToggle,
}: {
  id: string; name: string; label: string; hint?: string; show: boolean; onToggle: () => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <div className="relative">
        <input
          id={id} name={name} type={show ? "text" : "password"} required
          className="w-full px-3.5 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
        />
        <button
          type="button" onClick={onToggle}
          className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-[10px] text-gray-400 mt-1 px-1">{hint}</p>}
    </div>
  );
}
