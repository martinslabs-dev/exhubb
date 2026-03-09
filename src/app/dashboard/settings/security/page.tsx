import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import ChangePasswordForm from "./ChangePasswordForm";
import { Monitor, Smartphone, Globe } from "lucide-react";

export const metadata: Metadata = { title: "Security | Exhubb" };

const MOCK_SESSIONS = [
  { id: "1", device: "Chrome on Windows",  location: "Lagos, NG",   icon: Monitor,     current: true,  lastSeen: "Now" },
  { id: "2", device: "Safari on iPhone",   location: "Lagos, NG",   icon: Smartphone,  current: false, lastSeen: "2h ago" },
];

export default async function SecurityPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { password: true },
  });

  const hasPassword = !!user?.password;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-2xl mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Security</h1>
        <p className="text-sm text-gray-500 mt-1">Protect your account and manage access</p>
      </div>

      {/* ── Change Password ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-1">Change Password</h2>
        {hasPassword ? (
          <p className="text-xs text-gray-500 mb-5">
            Choose a strong password that you don&apos;t use anywhere else.
          </p>
        ) : (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-5">
            Your account uses social login (Google / GitHub). Password login is not configured.
          </p>
        )}
        {hasPassword && <ChangePasswordForm />}
      </div>

      {/* ── Active Sessions ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-1">Active Sessions</h2>
        <p className="text-xs text-gray-500 mb-4">Devices currently signed in to your account</p>
        <ul className="space-y-3">
          {MOCK_SESSIONS.map(({ id, device, location, icon: Icon, current, lastSeen }) => (
            <li key={id} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{device}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {location} · {lastSeen}
                </p>
              </div>
              {current ? (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  This device
                </span>
              ) : (
                <button className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors">
                  Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Two-Factor Auth ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-1">Two-Factor Authentication</h2>
            <p className="text-xs text-gray-500">
              Add an extra layer of security to your account by requiring a code when you sign in.
            </p>
          </div>
          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
            Coming soon
          </span>
        </div>
        <button
          disabled
          className="mt-4 px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
        >
          Enable 2FA
        </button>
      </div>

    </div>
  );
}
