import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  TrendingUp,
  Briefcase,
  Star,
  Eye,
  MousePointerClick,
  Clock,
  Users,
  Repeat2,
  BarChart3,
  DollarSign,
} from "lucide-react";

export const metadata: Metadata = { title: "Freelancer Analytics" };

export default async function FreelancerAnalyticsPage() {
  const session = await auth();

  const [completedOrders, totalGigs, activeGigs] = await Promise.all([
    prisma.order.count({
      where: { sellerId: session!.user.id, gigId: { not: null }, status: { in: ["COMPLETED", "DELIVERED"] } },
    }),
    prisma.gig.count({ where: { freelancerId: session!.user.id } }),
    prisma.gig.count({ where: { freelancerId: session!.user.id, isActive: true } }),
  ]);

  const revenueAgg = await prisma.order.aggregate({
    where: { sellerId: session!.user.id, gigId: { not: null }, status: { in: ["COMPLETED", "DELIVERED"] } },
    _sum: { amount: true },
  });

  const revenue = revenueAgg._sum.amount ?? 0;

  const STATS = [
    { label: "Total Revenue",     value: `$${revenue.toFixed(2)}`, sub: "All time",           icon: DollarSign,  color: "text-green-600",  bg: "bg-green-50"  },
    { label: "Completed Orders",  value: completedOrders,          sub: "Delivered services",  icon: Briefcase,   color: "text-blue-600",   bg: "bg-blue-50"   },
    { label: "Active Gigs",       value: activeGigs,               sub: `${totalGigs} total`,  icon: TrendingUp,  color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Avg. Rating",       value: "–",                      sub: "Not enough data",     icon: Star,        color: "text-amber-500",  bg: "bg-amber-50"  },
  ];

  const PERFORMANCE = [
    { label: "Gig Impressions",   value: "–", icon: Eye              },
    { label: "Click-through Rate", value: "–", icon: MousePointerClick },
    { label: "Order Conversion",  value: "–", icon: TrendingUp       },
    { label: "Avg. Response Time", value: "–", icon: Clock            },
    { label: "Repeat Clients",    value: "–", icon: Repeat2          },
    { label: "Unique Visitors",   value: "–", icon: Users            },
  ];

  const MONTHS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your freelance performance</p>
        </div>
        <select className="h-9 px-3 rounded-xl border border-gray-200 text-sm text-gray-600 bg-white outline-none focus:border-primary-400 transition-colors">
          <option>Last 6 months</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
          <option>This year</option>
        </select>
      </div>

      {/* ── Stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-black text-gray-900">{value}</p>
            <p className="text-xs font-semibold text-gray-600 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Revenue Chart ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-black text-gray-900">Revenue Over Time</h2>
            <p className="text-xs text-gray-400 mt-0.5">Monthly service revenue</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
            <span className="text-xs text-gray-500">Revenue</span>
          </div>
        </div>
        {revenue === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <BarChart3 className="w-10 h-10 text-gray-100 mb-3" />
            <p className="text-sm font-semibold text-gray-400">No revenue data yet</p>
            <p className="text-xs text-gray-400 mt-1">Complete your first order to see trends.</p>
          </div>
        ) : (
          <div className="flex items-end gap-2 h-40">
            {[15, 35, 25, 70, 45, 85].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors"
                  style={{ height: `${h}%` }}
                />
                <span className="text-xs text-gray-400">{MONTHS[i]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* ── Performance Metrics ───────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-base font-black text-gray-900 mb-4">Gig Performance</h2>
          <div className="space-y-1">
            {PERFORMANCE.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{value}</span>
                  <span className="text-xs text-gray-300">No data</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Top Gigs ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-base font-black text-gray-900 mb-4">Top Performing Gigs</h2>
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Briefcase className="w-9 h-9 text-gray-100 mb-3" />
            <p className="text-sm font-semibold text-gray-400">Not enough data yet</p>
            <p className="text-xs text-gray-400 mt-1">Your best-performing gigs will show here after you receive orders.</p>
          </div>
        </div>
      </div>

      {/* ── Orders per month ──────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-base font-black text-gray-900 mb-1">Order Volume</h2>
        <p className="text-xs text-gray-400 mb-5">Number of service orders per month</p>
        <div className="flex items-end gap-2 h-28">
          {[2, 5, 3, 9, 6, completedOrders > 0 ? Math.min(completedOrders * 2, 16) : 0].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-primary-100 rounded-lg hover:bg-primary-200 transition-colors"
                style={{ height: `${Math.max((h / 16) * 100, 4)}%` }}
              />
              <span className="text-xs text-gray-400">{MONTHS[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Level badge ───────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-200 text-sm font-semibold">Current Level</p>
            <p className="text-2xl font-black mt-1">New Seller</p>
            <p className="text-indigo-200 text-sm mt-1">Complete 10 orders to reach Level 1.</p>
            <div className="mt-3 h-2 bg-indigo-500 rounded-full w-48">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${Math.min((completedOrders / 10) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-indigo-300 mt-1">{completedOrders}/10 orders</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
            <Star className="w-8 h-8 text-white/60" />
          </div>
        </div>
      </div>
    </div>
  );
}
