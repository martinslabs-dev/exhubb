import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
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
} from "lucide-react";

export const metadata: Metadata = { title: "Buyer Overview" };

export default async function BuyerDashboard() {
  const session = await auth();
  const userId  = session!.user.id;
  const name    = session?.user?.name?.split(" ")[0] ?? "there";

  // Real data queries — fall back to zeros if DB is unreachable
  let activeOrders    = 0;
  let deliveredOrders = 0;
  let savedCount      = 0;
  let user: { name: string | null; image: string | null; location: string | null } | null = null;
  let hasReview:   { id: string } | null = null;
  let hasPurchase: { id: string } | null = null;

  try {
    [activeOrders, deliveredOrders, savedCount, user, hasReview, hasPurchase] = await Promise.all([
      prisma.order.count({ where: { buyerId: userId, status: { in: ["PENDING", "IN_PROGRESS", "SHIPPED"] } } }),
      prisma.order.count({ where: { buyerId: userId, status: { in: ["DELIVERED", "COMPLETED"] } } }),
      prisma.savedItem.count({ where: { userId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, image: true, location: true } }),
      prisma.review.findFirst({ where: { reviewerId: userId }, select: { id: true } }),
      prisma.order.findFirst({ where: { buyerId: userId, status: { in: ["DELIVERED", "COMPLETED"] } }, select: { id: true } }),
    ]);
  } catch {
    // DB temporarily unreachable — page renders with default/zero values
  }

  const profileComplete = !!(user?.name && user?.image && user?.location);

  // Checklist — real DB checks
  const checklist = [
    { label: "Create your Exhubb account", done: true,                href: null                           },
    { label: "Complete your profile",      done: profileComplete,     href: "/dashboard/settings/profile"  },
    { label: "Save your first item",       done: savedCount > 0,      href: "/"                            },
    { label: "Make your first purchase",   done: !!hasPurchase,       href: "/"                            },
    { label: "Leave a seller review",      done: !!hasReview,         href: "/dashboard/buyer/orders"      },
  ];
  const completed = checklist.filter((c) => c.done).length;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl mx-auto space-y-6">

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Buyer Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome back, {name}. Here&apos;s your account overview.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700"
        >
          <Search className="w-4 h-4" />
          Browse Products
        </Link>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active Orders",    value: String(activeOrders),    sub: "In progress",    icon: ShoppingBag },
          { label: "Total Delivered",  value: String(deliveredOrders), sub: "All time",       icon: Package     },
          { label: "Watchlist",        value: "0",                     sub: "Tracking prices",icon: Heart       },
          { label: "Saved Items",      value: String(savedCount),      sub: "Bookmarked",     icon: Bookmark    },
        ].map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500">{label}</span>
              <Icon className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Main Two-column grid ─────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left 2/3 ──────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Recent Orders */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Recent Orders</h2>
              <Link
                href="/dashboard/buyer/orders"
                className="text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="px-5 py-12 text-center">
              <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">No orders yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Your orders will appear here once you start shopping.
              </p>
              <Link
                href="/"
                className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
              >
                Browse products <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Quick Access */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Quick Access</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { label: "Browse Products",  href: "/products",                icon: ShoppingBag,   desc: "Shop millions of products"     },
                { label: "Hire Freelancers", href: "/gigs",                    icon: Briefcase,     desc: "Find world-class talent"        },
                { label: "My Orders",        href: "/dashboard/buyer/orders",  icon: Package,       desc: "Track and manage orders"        },
                { label: "Saved Items",      href: "/dashboard/buyer/saved",   icon: Bookmark,      desc: "Items you bookmarked"           },
                { label: "Messages",         href: "/dashboard/buyer/messages",icon: MessageSquare, desc: "Conversations with sellers"     },
              ].map(({ label, href, icon: Icon, desc }) => (
                <Link key={label} href={href} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 group">
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-gray-400" />
                    <span>
                      <span className="block text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
                      <span className="block text-xs text-gray-400">{desc}</span>
                    </span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right column ──────────────────────────────────── */}
        <div className="space-y-6">

          {/* Setup checklist */}
          {completed < checklist.length && (
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Setup Checklist</h2>
                <span className="text-xs text-gray-400">{completed} / {checklist.length}</span>
              </div>
              <div className="px-5 py-4 space-y-3">
                {checklist.map(({ label, done, href }) => (
                  <div key={label} className="flex items-start gap-3">
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                    )}
                    {href && !done ? (
                      <Link href={href} className="text-sm text-gray-600 hover:text-gray-900 hover:underline">
                        {label}
                      </Link>
                    ) : (
                      <span className={`text-sm ${done ? "text-gray-400 line-through" : "text-gray-600"}`}>
                        {label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Become a seller */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Want to sell on Exhubb?</h2>
            <p className="text-xs text-gray-500 mb-4">
              List products or offer services and start earning. No listing fees to get started.
            </p>
            <div className="space-y-2">
              <Link
                href="/dashboard/seller"
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 group"
              >
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">Sell products</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500" />
              </Link>
              <Link
                href="/dashboard/freelancer"
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 group"
              >
                <span className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">Offer services</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
