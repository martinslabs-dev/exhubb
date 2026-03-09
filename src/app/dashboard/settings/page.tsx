import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { User2, Shield, Bell, CreditCard, ChevronRight } from "lucide-react";

export const metadata: Metadata = { title: "Settings | Exhubb" };

const SECTIONS = [
  {
    href:        "/dashboard/settings/profile",
    icon:        User2,
    title:       "Profile",
    description: "Update your name, bio, avatar, and public info",
    color:       "bg-primary-50 text-primary-600",
    border:      "group-hover:border-primary-200",
  },
  {
    href:        "/dashboard/settings/security",
    icon:        Shield,
    title:       "Security",
    description: "Change your password and manage active sessions",
    color:       "bg-emerald-50 text-emerald-600",
    border:      "group-hover:border-emerald-200",
  },
  {
    href:        "/dashboard/settings/notifications",
    icon:        Bell,
    title:       "Notification Preferences",
    description: "Choose which emails and in-app alerts you receive",
    color:       "bg-amber-50 text-amber-600",
    border:      "group-hover:border-amber-200",
  },
  {
    href:        "/dashboard/settings/payouts",
    icon:        CreditCard,
    title:       "Payouts",
    description: "Connect a payout method and view your payout history",
    color:       "bg-violet-50 text-violet-600",
    border:      "group-hover:border-violet-200",
  },
];

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const user     = session.user;
  const initials = (user.name ?? "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-2xl mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      {/* ── User Card ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-black text-lg flex-shrink-0 select-none">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-gray-900">{user.name ?? "Your Account"}</p>
          <p className="text-sm text-gray-500 truncate">{user.email}</p>
        </div>
        <Link
          href="/dashboard/settings/profile"
          className="text-sm font-semibold text-primary-600 hover:text-primary-700 whitespace-nowrap"
        >
          Edit Profile
        </Link>
      </div>

      {/* ── Setting Sections ──────────────────────────────── */}
      <div className="space-y-2">
        {SECTIONS.map(({ href, icon: Icon, title, description, color, border }) => (
          <Link
            key={href}
            href={href}
            className={`group flex items-center gap-4 bg-white rounded-xl border border-gray-200 ${border} p-4 hover:shadow-sm transition-all`}
          >
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 flex-shrink-0 transition-colors" />
          </Link>
        ))}
      </div>

      {/* ── Danger Zone ───────────────────────────────────── */}
      <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
        <h3 className="font-bold text-red-700 text-sm mb-1">Danger Zone</h3>
        <p className="text-xs text-red-500 mb-3">
          Permanently delete your account and all of your data. This action cannot be undone.
        </p>
        <button
          disabled
          className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Delete Account
        </button>
      </div>

    </div>
  );
}
