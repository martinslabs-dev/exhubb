"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/lib/actions/auth";
import type { DashboardUser } from "./DashboardShell";
import {
  Menu,
  Search,
  Bell,
  MessageSquare,
  Settings,
  User,
  LogOut,
  ChevronDown,
  ExternalLink,
} from "lucide-react";

// ─── Page title map ───────────────────────────────────────────
const TITLES: Record<string, string> = {
  "/dashboard/buyer":                   "Overview",
  "/dashboard/buyer/orders":            "My Orders",
  "/dashboard/buyer/watchlist":         "Watchlist",
  "/dashboard/buyer/saved":             "Saved Items",
  "/dashboard/buyer/messages":          "Messages",
  "/dashboard/seller":                  "Seller Hub",
  "/dashboard/seller/listings":         "My Listings",
  "/dashboard/seller/listings/new":     "Create Listing",
  "/dashboard/seller/orders":           "Orders",
  "/dashboard/seller/reviews":          "Reviews",
  "/dashboard/seller/analytics":        "Analytics",
  "/dashboard/seller/earnings":         "Earnings",
  "/dashboard/seller/messages":         "Messages",
  "/dashboard/freelancer":              "Freelancer Studio",
  "/dashboard/freelancer/gigs":         "My Gigs",
  "/dashboard/freelancer/gigs/new":     "Create Gig",
  "/dashboard/freelancer/orders":       "Active Orders",
  "/dashboard/freelancer/analytics":    "Analytics",
  "/dashboard/freelancer/earnings":     "Earnings",
  "/dashboard/freelancer/messages":     "Messages",  "/dashboard/wallet":                  "Wallet",
  "/dashboard/notifications":            "Notifications",
  "/dashboard/settings":                "Settings",
  "/dashboard/settings/profile":        "Profile",
  "/dashboard/settings/security":       "Security",
  "/dashboard/settings/notifications":  "Notification Preferences",
  "/dashboard/settings/payouts":        "Payouts",
};

function getTitle(pathname: string) {
  // Exact match first
  if (TITLES[pathname]) return TITLES[pathname];
  // Partial match (e.g. /dashboard/seller/listings/abc-123 → "Listings")
  const parts = pathname.split("/");
  for (let i = parts.length; i > 0; i--) {
    const key = parts.slice(0, i).join("/");
    if (TITLES[key]) return TITLES[key];
  }
  return "Dashboard";
}

// ─── Topbar ───────────────────────────────────────────────────
export default function Topbar({
  user,
  unreadMessages,
  unreadNotifications,
  onMenuClick,
}: {
  user: DashboardUser;
  unreadMessages: number;
  unreadNotifications: number;
  onMenuClick: () => void;
}) {
  const pathname          = usePathname();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [searchVal,  setSearchVal]  = useState("");
  const avatarRef         = useRef<HTMLDivElement>(null);
  const title             = getTitle(pathname);

  // Close avatar dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "U";

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 gap-4 flex-shrink-0 z-20">
      {/* ── Left: hamburger + title ──────────────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors md:hidden flex-shrink-0"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-base font-bold text-gray-900 truncate hidden sm:block">
          {title}
        </h1>
      </div>

      {/* ── Centre: search bar ───────────────────────────── */}
      <div className="flex-1 max-w-sm hidden md:block">
        <div
          className={cn(
            "flex items-center gap-2 h-9 px-3 rounded-xl border transition-all duration-200 bg-gray-50",
            searchVal
              ? "border-primary-400 ring-2 ring-primary-100 bg-white"
              : "border-gray-200 hover:border-gray-300"
          )}
        >
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search anything…"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
          />
          {searchVal && (
            <button
              onClick={() => setSearchVal("")}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── Right: actions + avatar ──────────────────────── */}
      <div className="flex items-center gap-1 ml-auto">
        {/* Messages */}
        <Link
          href={
            pathname.startsWith("/dashboard/seller")
              ? "/dashboard/seller/messages"
              : pathname.startsWith("/dashboard/freelancer")
              ? "/dashboard/freelancer/messages"
              : "/dashboard/buyer/messages"
          }
          className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
          aria-label="Messages"
        >
          <MessageSquare className="w-5 h-5 text-gray-600" />
          {unreadMessages > 0 && (
            <span className="absolute top-1 right-1 min-w-[1rem] h-4 bg-primary-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 tabular-nums">
              {unreadMessages > 99 ? "99+" : unreadMessages}
            </span>
          )}
        </Link>

        {/* Notifications */}
        <Link
          href="/dashboard/notifications"
          className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-gray-600" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 min-w-[1rem] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 tabular-nums">
              {unreadNotifications > 99 ? "99+" : unreadNotifications}
            </span>
          )}
        </Link>

        {/* Avatar + dropdown */}
        <div ref={avatarRef} className="relative ml-1">
          <button
            onClick={() => setAvatarOpen((v) => !v)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              {user.image
                ? <img src={user.image} alt={user.name ?? ""} className="w-full h-full object-cover" />
                : <span className="text-white text-xs font-black">{initials}</span>}
            </div>
            <span className="hidden sm:block text-sm font-semibold text-gray-700 max-w-[100px] truncate">
              {user.name?.split(" ")[0] ?? "User"}
            </span>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-gray-400 transition-transform duration-200 hidden sm:block",
                avatarOpen && "rotate-180"
              )}
            />
          </button>

          {/* Dropdown */}
          {avatarOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
              {/* User info */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>

              {/* Links */}
              <div className="p-1.5">
                <Link
                  href="/dashboard/settings/profile"
                  onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  Your Profile
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  Settings
                </Link>
                <Link
                  href="/"
                  target="_blank"
                  onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                  View Store
                </Link>
              </div>

              {/* Sign out */}
              <div className="p-1.5 border-t border-gray-100">
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
