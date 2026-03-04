import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  Store,
  Package,
  BarChart2,
  Wallet,
  ArrowRight,
  CheckCircle2,
  Circle,
  PlusCircle,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Star,
} from "lucide-react";

export const metadata: Metadata = { title: "Seller Hub" };

export default async function SellerDashboard() {
  const session = await auth();

  // Redirect if user hasn't activated seller role
  if (!session?.user?.isSeller) {
    redirect("/dashboard/buyer");
  }

  const name = session.user.name?.split(" ")[0] ?? "there";

  const checklist = [
    { label: "Create your account",             done: true,  href: null                               },
    { label: "Complete your seller profile",    done: false, href: "/dashboard/settings/profile"     },
    { label: "Create your first listing",       done: false, href: "/dashboard/seller/listings/new"  },
    { label: "Set up your payout method",       done: false, href: "/dashboard/settings/payouts"     },
    { label: "Make your first sale",            done: false, href: "/dashboard/seller/listings"       },
  ];
  const completed = checklist.filter((c) => c.done).length;
  const progress  = Math.round((completed / checklist.length) * 100);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl mx-auto space-y-6">

      {/* ── Welcome Banner ──────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0a0a1a] via-[#0d1433] to-[#0a0a1a] p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_0%_50%,rgba(99,102,241,0.18)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_100%_50%,rgba(234,179,8,0.10)_0%,transparent_70%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-indigo-400 text-sm font-semibold mb-1 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" />
              Seller Hub
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              Your Store, {name} 🏪
            </h2>
            <p className="text-gray-400 text-sm max-w-md">
              List your products, manage orders, and grow your business on Exhubb.
            </p>
          </div>
          <Link
            href="/dashboard/seller/listings/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors shadow-lg shadow-indigo-900/40 flex-shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            Create Listing
          </Link>
        </div>
      </div>

      {/* ── Stats Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Revenue (30d)",     value: "$0",  icon: Wallet,    bg: "bg-green-50",  iconCls: "text-green-600",  desc: "Total earnings"     },
          { label: "Orders Queue",      value: "0",   icon: Package,   bg: "bg-blue-50",   iconCls: "text-blue-600",   desc: "Awaiting shipment"  },
          { label: "Active Listings",   value: "0",   icon: Store,     bg: "bg-indigo-50", iconCls: "text-indigo-600", desc: "Live products"       },
          { label: "Seller Rating",     value: "—",   icon: Star,      bg: "bg-amber-50",  iconCls: "text-amber-500",  desc: "Average score"       },
        ].map(({ label, value, icon: Icon, bg, iconCls, desc }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 hover:shadow-md hover:border-gray-200 transition-all"
          >
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${iconCls}`} />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-gray-900">{value}</p>
            <p className="text-sm font-semibold text-gray-700 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
          </div>
        ))}
      </div>

      {/* ── Revenue chart placeholder + grid ─────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left 2/3 ─────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Revenue chart placeholder */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                Revenue Overview
              </h3>
              <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-100">
                <TrendingUp className="w-3 h-3" />
                Last 30 days
              </div>
            </div>
            {/* Chart empty state */}
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                <BarChart2 className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-500 mb-1">No sales data yet</p>
              <p className="text-xs text-gray-400 mb-4 max-w-xs">
                Your revenue chart will populate once you start making sales.
              </p>
              <Link
                href="/dashboard/seller/listings/new"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Create your first listing
              </Link>
            </div>
          </div>

          {/* Recent orders empty state */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                Recent Orders
              </h3>
              <Link
                href="/dashboard/seller/orders"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                <Package className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-500 mb-1">No orders yet</p>
              <p className="text-xs text-gray-400 max-w-xs">
                Orders will appear here once buyers purchase your listings.
              </p>
            </div>
          </div>
        </div>

        {/* ── Right column ─────────────────────────────────── */}
        <div className="space-y-4">

          {/* Checklist */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                Getting Started
              </h3>
              <span className="text-xs font-bold text-primary-600">
                {completed}/{checklist.length}
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full mb-4 mt-2">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <ul className="space-y-2.5">
              {checklist.map(({ label, done, href }) => (
                <li key={label}>
                  {href && !done ? (
                    <Link href={href} className="flex items-start gap-2.5 group">
                      <Circle className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5 group-hover:text-primary-400 transition-colors" />
                      <span className="text-sm text-gray-500 group-hover:text-primary-600 transition-colors">
                        {label}
                      </span>
                    </Link>
                  ) : (
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${done ? "text-primary-500" : "text-gray-300"}`}
                      />
                      <span className={`text-sm ${done ? "text-gray-400 line-through" : "text-gray-500"}`}>
                        {label}
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Account health */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-primary-600" />
              <h3 className="text-sm font-bold text-gray-700">Account Health</h3>
              <span className="ml-auto text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                Excellent
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full mb-3">
              <div className="h-full w-full bg-gradient-to-r from-primary-500 to-green-400 rounded-full" />
            </div>
            <div className="space-y-1.5">
              {[
                { label: "Late shipments",   value: "0%",  ok: true },
                { label: "Cancellation rate",value: "0%",  ok: true },
                { label: "Defect rate",       value: "0%",  ok: true },
              ].map(({ label, value, ok }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{label}</span>
                  <span className={`font-bold ${ok ? "text-green-600" : "text-red-500"}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick link to messages */}
          <Link
            href="/dashboard/seller/messages"
            className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 hover:border-primary-200 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-primary-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-800 group-hover:text-primary-700 transition-colors">
                Buyer Messages
              </p>
              <p className="text-xs text-gray-400">No unread messages</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 ml-auto flex-shrink-0 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
