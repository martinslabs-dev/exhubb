import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  Briefcase,
  ClipboardList,
  TrendingUp,
  Wallet,
  ArrowRight,
  CheckCircle2,
  Circle,
  PlusCircle,
  MessageSquare,
  Eye,
  MousePointerClick,
  ShoppingCart,
  DollarSign,
  Star,
  Trophy,
} from "lucide-react";

export const metadata: Metadata = { title: "Freelancer Studio" };

export default async function FreelancerDashboard() {
  const session = await auth();

  if (!session?.user?.isFreelancer) {
    redirect("/dashboard/buyer");
  }

  const name = session.user.name?.split(" ")[0] ?? "there";

  const checklist = [
    { label: "Create your account",          done: true,  href: null                                  },
    { label: "Complete your freelancer profile", done: false, href: "/dashboard/settings/profile"     },
    { label: "Create your first gig",        done: false, href: "/dashboard/freelancer/gigs/new"      },
    { label: "Set up your payout method",    done: false, href: "/dashboard/settings/payouts"         },
    { label: "Complete your first order",    done: false, href: "/dashboard/freelancer/orders"        },
  ];
  const completed = checklist.filter((c) => c.done).length;
  const progress  = Math.round((completed / checklist.length) * 100);

  // Level progress — new freelancers start at 0 orders, need 10 for Level 1
  const ordersCompleted = 0;
  const nextLevelOrders = 10;
  const levelProgress   = Math.round((ordersCompleted / nextLevelOrders) * 100);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl mx-auto space-y-6">

      {/* ── Welcome Banner ──────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a0a0a] via-[#2a0d12] to-[#1a0a0a] p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_0%_50%,rgba(234,179,8,0.15)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_100%_50%,rgba(34,197,94,0.10)_0%,transparent_70%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-gold-400 text-sm font-semibold mb-1 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              Freelancer Studio
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              Your Studio, {name} 🎨
            </h2>
            <p className="text-gray-400 text-sm max-w-md">
              Create gigs, manage orders, and grow your freelance career on Exhubb.
            </p>
          </div>
          <Link
            href="/dashboard/freelancer/gigs/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-500 text-white text-sm font-bold transition-colors shadow-lg shadow-gold-900/40 flex-shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            Create Gig
          </Link>
        </div>
      </div>

      {/* ── Stats Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Orders in Queue",    value: "0",  icon: ClipboardList, bg: "bg-blue-50",   iconCls: "text-blue-600",   desc: "Active right now"    },
          { label: "Earned (30d)",       value: "$0", icon: Wallet,        bg: "bg-green-50",  iconCls: "text-green-600",  desc: "Net earnings"        },
          { label: "Completion Rate",    value: "—",  icon: Trophy,        bg: "bg-amber-50",  iconCls: "text-amber-500",  desc: "Orders completed"    },
          { label: "Seller Rating",      value: "—",  icon: Star,          bg: "bg-purple-50", iconCls: "text-purple-600", desc: "Average score"        },
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

      {/* ── Main Grid ────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left 2/3 ─────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Analytics funnel */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                Performance Funnel
              </h3>
              <Link
                href="/dashboard/freelancer/analytics"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
              >
                Full analytics <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Funnel steps */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Impressions",  value: "0",    icon: Eye,              iconBg: "bg-blue-50",   iconCls: "text-blue-500",    sub: "Gig views"       },
                { label: "Clicks",       value: "0",    icon: MousePointerClick, iconBg: "bg-purple-50", iconCls: "text-purple-500",   sub: "0% CTR"          },
                { label: "Orders",       value: "0",    icon: ShoppingCart,     iconBg: "bg-green-50",  iconCls: "text-green-500",   sub: "0% CVR"          },
                { label: "Revenue",      value: "$0",   icon: DollarSign,       iconBg: "bg-amber-50",  iconCls: "text-amber-500",   sub: "Net earned"      },
              ].map(({ label, value, icon: Icon, iconBg, iconCls, sub }, i) => (
                <div key={label} className="relative">
                  {/* Connector arrow */}
                  {i < 3 && (
                    <div className="absolute top-5 -right-1 z-10 text-gray-200 text-lg leading-none select-none hidden sm:block">
                      →
                    </div>
                  )}
                  <div className="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center mb-2`}>
                      <Icon className={`w-4 h-4 ${iconCls}`} />
                    </div>
                    <p className="text-lg font-black text-gray-900">{value}</p>
                    <p className="text-[11px] font-bold text-gray-600">{label}</p>
                    <p className="text-[10px] text-gray-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400 text-center mt-4">
              Analytics will populate once your gigs go live.
            </p>
          </div>

          {/* Active orders empty state */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                Active Orders
              </h3>
              <Link
                href="/dashboard/freelancer/orders"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                <ClipboardList className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-500 mb-1">No active orders</p>
              <p className="text-xs text-gray-400 mb-4 max-w-xs">
                Create a gig and start receiving orders from clients.
              </p>
              <Link
                href="/dashboard/freelancer/gigs/new"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold-600 text-white text-xs font-bold hover:bg-gold-700 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Create your first gig
              </Link>
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

          {/* Level progress */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-gold-500" />
              <h3 className="text-sm font-bold text-gray-700">Your Level</h3>
            </div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-gray-500">New Seller</span>
              <span className="text-xs font-bold text-gold-600">Level 1</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full mb-2">
              <div
                className="h-full bg-gradient-to-r from-gold-400 to-gold-600 rounded-full transition-all duration-700"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">
              Complete <span className="font-bold text-gray-600">{nextLevelOrders} orders</span> to reach Level 1
            </p>

            {/* Level perks */}
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Level 1 Unlocks</p>
              {["Priority search ranking", "Verified seller badge", "Custom gig extras"].map((perk) => (
                <div key={perk} className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold-400 flex-shrink-0" />
                  {perk}
                </div>
              ))}
            </div>
          </div>

          {/* Messages */}
          <Link
            href="/dashboard/freelancer/messages"
            className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 hover:border-gold-200 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-gold-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-800 group-hover:text-gold-700 transition-colors">
                Client Messages
              </p>
              <p className="text-xs text-gray-400">No unread messages</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gold-500 ml-auto flex-shrink-0 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
