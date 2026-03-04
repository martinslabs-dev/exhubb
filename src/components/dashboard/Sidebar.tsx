"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import ExhubbLogo from "@/components/ExhubbLogo";
import { signOutAction } from "@/lib/actions/auth";
import type { DashboardUser } from "./DashboardShell";
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  Bookmark,
  MessageSquare,
  Store,
  Package,
  BarChart2,
  Wallet,
  Briefcase,
  ClipboardList,
  TrendingUp,
  Settings,
  LogOut,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────
type Role = "buyer" | "seller" | "freelancer";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
}

// ─── Nav configurations per role ─────────────────────────────
const NAV: Record<Role, NavItem[]> = {
  buyer: [
    { label: "Overview",   icon: LayoutDashboard, href: "/dashboard/buyer" },
    { label: "Orders",     icon: ShoppingBag,     href: "/dashboard/buyer/orders" },
    { label: "Watchlist",  icon: Heart,           href: "/dashboard/buyer/watchlist" },
    { label: "Saved",      icon: Bookmark,        href: "/dashboard/buyer/saved" },
    { label: "Messages",   icon: MessageSquare,   href: "/dashboard/buyer/messages" },
  ],
  seller: [
    { label: "Overview",   icon: LayoutDashboard, href: "/dashboard/seller" },
    { label: "Listings",   icon: Store,           href: "/dashboard/seller/listings" },
    { label: "Orders",     icon: Package,         href: "/dashboard/seller/orders" },
    { label: "Analytics",  icon: BarChart2,       href: "/dashboard/seller/analytics" },
    { label: "Earnings",   icon: Wallet,          href: "/dashboard/seller/earnings" },
    { label: "Messages",   icon: MessageSquare,   href: "/dashboard/seller/messages" },
  ],
  freelancer: [
    { label: "Overview",   icon: LayoutDashboard, href: "/dashboard/freelancer" },
    { label: "My Gigs",    icon: Briefcase,       href: "/dashboard/freelancer/gigs" },
    { label: "Orders",     icon: ClipboardList,   href: "/dashboard/freelancer/orders" },
    { label: "Analytics",  icon: TrendingUp,      href: "/dashboard/freelancer/analytics" },
    { label: "Earnings",   icon: Wallet,          href: "/dashboard/freelancer/earnings" },
    { label: "Messages",   icon: MessageSquare,   href: "/dashboard/freelancer/messages" },
  ],
};

const ROLE_META = [
  { id: "buyer"      as Role, label: "Buyer",      icon: ShoppingBag, desc: "Shop & order"     },
  { id: "seller"     as Role, label: "Seller",     icon: Store,       desc: "Sell products"    },
  { id: "freelancer" as Role, label: "Freelancer", icon: Briefcase,   desc: "Offer services"   },
];

// ─── Sidebar ──────────────────────────────────────────────────
export default function Sidebar({
  user,
  open,
  onClose,
}: {
  user: DashboardUser;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router   = useRouter();

  // Derive active role from URL
  const activeRole: Role = pathname.startsWith("/dashboard/seller")
    ? "seller"
    : pathname.startsWith("/dashboard/freelancer")
    ? "freelancer"
    : "buyer";

  const hasRole = (role: Role) =>
    role === "buyer"      ? user.isBuyer
    : role === "seller"   ? user.isSeller
    : user.isFreelancer;

  const isActive = (href: string) =>
    href === `/dashboard/${activeRole}`
      ? pathname === href
      : pathname.startsWith(href);

  const handleRoleSwitch = (role: Role) => {
    router.push(`/dashboard/${role}`);
    onClose();
  };

  // ── Inner content (shared desktop + mobile) ──────────────
  const content = (
    <div className="flex flex-col h-full">
      {/* ── Logo bar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100 flex-shrink-0">
        <Link href="/" onClick={onClose}>
          <ExhubbLogo variant="full" size={26} noAnimate />
        </Link>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors md:hidden"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* ── Role Switcher ─────────────────────────────────── */}
      <div className="px-3 pt-4 pb-3 border-b border-gray-100">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">
          Active Mode
        </p>
        <div className="space-y-0.5">
          {ROLE_META.map(({ id, label, icon: Icon, desc }) => {
            const enabled = hasRole(id);
            const active  = activeRole === id;

            if (!enabled) {
              return (
                <button
                  key={id}
                  onClick={() => router.push(`/register?intent=${id}`)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors hover:bg-gray-50 group"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-gray-400" />
                    </span>
                    <span className="text-gray-400 font-medium">{label}</span>
                  </span>
                  <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full group-hover:bg-primary-100 transition-colors flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    Activate
                  </span>
                </button>
              );
            }

            return (
              <button
                key={id}
                onClick={() => handleRoleSwitch(id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                      active ? "bg-white/20" : "bg-gray-100"
                    )}
                  >
                    <Icon className={cn("w-3.5 h-3.5", active ? "text-white" : "text-gray-500")} />
                  </span>
                  <span>{label}</span>
                </span>
                {active && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">
          {activeRole === "buyer"
            ? "Shopping"
            : activeRole === "seller"
            ? "Selling"
            : "Freelancing"}
        </p>
        <ul className="space-y-0.5">
          {NAV[activeRole].map(({ label, icon: Icon, href }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                    active
                      ? "bg-primary-50 text-primary-700 font-semibold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 flex-shrink-0",
                      active ? "text-primary-600" : "text-gray-400"
                    )}
                  />
                  <span>{label}</span>
                  {active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Bottom: Settings + Sign Out ───────────────────── */}
      <div className="px-3 py-3 border-t border-gray-100 space-y-0.5">
        <Link
          href="/dashboard/settings"
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
            pathname.startsWith("/dashboard/settings")
              ? "bg-primary-50 text-primary-700"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <Settings className="w-4 h-4 text-gray-400" />
          <span>Settings</span>
        </Link>

        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all group"
          >
            <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition-colors" />
            <span>Sign Out</span>
          </button>
        </form>

        {/* User badge at very bottom */}
        <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 text-primary-700 text-[11px] font-black">
            {user.name?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-700 truncate">{user.name ?? "User"}</p>
            <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 flex-shrink-0 h-screen">
        {content}
      </aside>

      {/* Mobile sidebar — drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40 flex flex-col md:hidden transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {content}
      </aside>
    </>
  );
}
