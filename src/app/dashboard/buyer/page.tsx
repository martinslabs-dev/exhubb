import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import {
  ShoppingBag,
  Package,
  Heart,
  Bookmark,
  ArrowRight,
  CheckCircle2,
  Circle,
  Search,
  Briefcase,
  MessageSquare,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export const metadata: Metadata = { title: "Buyer Overview" };

export default async function BuyerDashboard() {
  const session = await auth();
  const name    = session?.user?.name?.split(" ")[0] ?? "there";

  // Checklist — item 0 is always done (account created)
  const checklist = [
    { label: "Create your Exhubb account",     done: true,  href: null                              },
    { label: "Complete your profile",          done: false, href: "/dashboard/settings/profile"    },
    { label: "Save your first item",           done: false, href: "/"                               },
    { label: "Make your first purchase",       done: false, href: "/"                               },
    { label: "Leave a seller review",          done: false, href: "/dashboard/buyer/orders"         },
  ];
  const completed = checklist.filter((c) => c.done).length;
  const progress  = Math.round((completed / checklist.length) * 100);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl mx-auto space-y-6">

      {/* ── Welcome Banner ──────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#061a0e] via-primary-900 to-[#0a2a15] p-6 sm:p-8">
        {/* Decorative bg */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_50%,rgba(34,197,94,0.18)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_100%_50%,rgba(234,179,8,0.08)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-primary-400 text-sm font-semibold mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Buyer Dashboard
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              Welcome back, {name}! 👋
            </h2>
            <p className="text-gray-400 text-sm max-w-md">
              Shop millions of products and hire world-class freelancers — all in one place.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-primary-900/40"
            >
              <Search className="w-4 h-4" />
              Shop Now
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Orders",  value: "0", icon: ShoppingBag, bg: "bg-blue-50",   iconCls: "text-blue-600",  desc: "In progress"      },
          { label: "Total Delivered",value: "0", icon: Package,     bg: "bg-green-50",  iconCls: "text-green-600", desc: "All time"          },
          { label: "Watchlist",      value: "0", icon: Heart,       bg: "bg-red-50",    iconCls: "text-red-500",   desc: "Tracking prices"   },
          { label: "Saved Items",    value: "0", icon: Bookmark,    bg: "bg-amber-50",  iconCls: "text-amber-600", desc: "Bookmarked"        },
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

      {/* ── Main Two-column grid ─────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Quick Actions (2/3) ──────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Quick action cards */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
              Quick Actions
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { label: "Browse Products",   href: "/",  icon: ShoppingBag, color: "from-blue-500 to-blue-600",    desc: "Shop millions of products"      },
                { label: "Hire Talent",       href: "/",  icon: Briefcase,   color: "from-primary-500 to-primary-700", desc: "Find world-class freelancers"  },
                { label: "Your Messages",     href: "/dashboard/buyer/messages", icon: MessageSquare, color: "from-purple-500 to-purple-600", desc: "Talk to sellers"  },
              ].map(({ label, href, icon: Icon, color, desc }) => (
                <Link
                  key={label}
                  href={href}
                  className="group flex flex-col gap-3 p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-primary-700 transition-colors">
                      {label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent orders — empty state */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                Recent Orders
              </h3>
              <Link
                href="/dashboard/buyer/orders"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                <ShoppingBag className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-500 mb-1">No orders yet</p>
              <p className="text-xs text-gray-400 mb-4 max-w-xs">
                Your orders will appear here once you start shopping.
              </p>
              <Link
                href="/"
                className="flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Start shopping <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Right column ─────────────────────────────────── */}
        <div className="space-y-4">

          {/* Getting started checklist */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                Getting Started
              </h3>
              <span className="text-xs font-bold text-primary-600">
                {completed}/{checklist.length}
              </span>
            </div>

            {/* Progress bar */}
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
                    <Link
                      href={href}
                      className="flex items-start gap-2.5 group"
                    >
                      <Circle className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5 group-hover:text-primary-400 transition-colors" />
                      <span className="text-sm text-gray-500 group-hover:text-primary-600 transition-colors">
                        {label}
                      </span>
                    </Link>
                  ) : (
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          done ? "text-primary-500" : "text-gray-300"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          done ? "text-gray-400 line-through" : "text-gray-500"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Trend tip */}
          <div className="rounded-2xl bg-gradient-to-br from-gold-50 to-amber-50 border border-gold-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-gold-600" />
              <p className="text-xs font-bold text-gold-700 uppercase tracking-widest">
                Trending Now
              </p>
            </div>
            <p className="text-sm font-semibold text-gray-800 mb-1">
              Electronics are 20% off this week
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Limited-time deals on top brands. Shop before they&rsquo;re gone.
            </p>
            <Link
              href="/"
              className="text-xs font-bold text-gold-700 hover:text-gold-800 flex items-center gap-1"
            >
              Explore deals <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
