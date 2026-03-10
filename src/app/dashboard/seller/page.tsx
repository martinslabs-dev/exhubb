import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
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
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Seller Hub" };

const STATUS_CONFIG = {
  PENDING:     { label: "Pending",     color: "bg-yellow-100 text-yellow-700" },
  CONFIRMED:   { label: "Confirmed",   color: "bg-blue-100 text-blue-700"     },
  IN_PROGRESS: { label: "In Progress", color: "bg-indigo-100 text-indigo-700" },
  SHIPPED:     { label: "Shipped",     color: "bg-purple-100 text-purple-700" },
  DELIVERED:   { label: "Delivered",   color: "bg-green-100 text-green-700"   },
  COMPLETED:   { label: "Completed",   color: "bg-green-100 text-green-700"   },
  CANCELLED:   { label: "Cancelled",   color: "bg-red-100 text-red-600"       },
  REFUNDED:    { label: "Refunded",    color: "bg-gray-100 text-gray-600"     },
  DISPUTED:    { label: "Disputed",    color: "bg-orange-100 text-orange-700" },
} as const;

export default async function SellerDashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Check role from DB — JWT roles are only stamped at sign-in and may be stale
  const roleCheck = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { isSeller: true },
  });
  if (!roleCheck?.isSeller) redirect("/dashboard/buyer");

  const userId = session.user.id;
  const name   = session.user.name?.split(" ")[0] ?? "there";
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // ── Fetch live stats ────────────────────────────────────────
  const [activeListings, queueCount, revenue30d, recentOrders, dbUser, ratingAgg] = await Promise.all([
    prisma.product.count({ where: { sellerId: userId, isActive: true } }),
    prisma.order.count({
      where: { sellerId: userId, status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS", "SHIPPED"] } },
    }),
    prisma.order.aggregate({
      where: { sellerId: userId, status: "COMPLETED", createdAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
    }),
    prisma.order.findMany({
      where:   { sellerId: userId },
      include: {
        product: { select: { title: true, images: true } },
        gig:     { select: { title: true } },
        buyer:   { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.user.findUnique({
      where:  { id: userId },
      select: { bio: true, location: true },
    }),
    prisma.review.aggregate({
      where: { product: { sellerId: userId } },
      _avg:   { rating: true },
      _count: { rating: true },
    }),
  ]);

  const revenue     = revenue30d._sum.amount ?? 0;
  const hasProfile  = !!(dbUser?.bio || dbUser?.location);
  const hasListings = activeListings > 0;
  const hasSale     = recentOrders.some((o) => o.status === "COMPLETED");

  const checklist = [
    { label: "Create your account",          done: true,         href: null                               },
    { label: "Complete your seller profile", done: hasProfile,   href: "/dashboard/settings/profile"     },
    { label: "Create your first listing",    done: hasListings,  href: "/dashboard/seller/listings/new"  },
    { label: "Set up your payout method",    done: false,        href: "/dashboard/settings/payouts"     },
    { label: "Make your first sale",         done: hasSale,      href: "/dashboard/seller/listings"      },
  ];
  const completed = checklist.filter((c) => c.done).length;
  const progress  = Math.round((completed / checklist.length) * 100);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto">

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Seller Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome back, {name}. Here&apos;s your store overview.
          </p>
        </div>
        <Link
          href="/dashboard/seller/listings/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700"
        >
          <PlusCircle className="w-4 h-4" />
          New Listing
        </Link>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Revenue (30 days)",
            value: `$${revenue.toFixed(2)}`,
            sub: "Completed orders",
            icon: Wallet,
          },
          {
            label: "Orders in Queue",
            value: String(queueCount),
            sub: "Awaiting action",
            icon: Package,
          },
          {
            label: "Active Listings",
            value: String(activeListings),
            sub: "Published products",
            icon: Store,
          },
          {
            label: "Avg. Rating",
            value: ratingAgg._count.rating > 0
              ? ratingAgg._avg.rating!.toFixed(1)
              : "—",
            sub: ratingAgg._count.rating > 0
              ? `${ratingAgg._count.rating} review${ratingAgg._count.rating !== 1 ? "s" : ""}`
              : "No reviews yet",
            icon: Star,
          },
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

      {/* ── Main Grid ─────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left 2/3 ──────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Recent Orders */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Recent Orders</h2>
              <Link
                href="/dashboard/seller/orders"
                className="text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Package className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">No orders yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Orders will appear here once buyers purchase your listings.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Product</th>
                      <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Buyer</th>
                      <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Amount</th>
                      <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Status</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentOrders.map((order) => {
                      const cfg   = STATUS_CONFIG[order.status];
                      const title = order.product?.title ?? order.gig?.title ?? "Order";
                      const thumb = order.product?.images?.[0];
                      return (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                {thumb
                                  ? <img src={thumb} alt={title} className="w-full h-full object-cover" /> // eslint-disable-line
                                  : <Package className="w-3.5 h-3.5 text-gray-300" />}
                              </div>
                              <span className="font-medium text-gray-800 truncate max-w-[160px]">{title}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-gray-500 whitespace-nowrap">
                            {order.buyer.name ?? order.buyer.email}
                          </td>
                          <td className="px-3 py-3 font-medium text-gray-900 tabular-nums whitespace-nowrap">
                            ${order.amount.toFixed(2)}
                          </td>
                          <td className="px-3 py-3">
                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", cfg.color)}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Link
                              href={`/dashboard/seller/orders/${order.id}`}
                              className="text-xs text-gray-400 hover:text-gray-700"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Account Performance */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Account Performance</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
                Good Standing
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { label: "Late shipment rate",   value: "0%",  threshold: "Target: &lt; 4%"  },
                { label: "Order cancellation rate", value: "0%", threshold: "Target: &lt; 2.5%" },
                { label: "Order defect rate",     value: "0%",  threshold: "Target: &lt; 1%"  },
              ].map(({ label, value, threshold }) => (
                <div key={label} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm text-gray-700">{label}</p>
                    <p className="text-xs text-gray-400"
                      dangerouslySetInnerHTML={{ __html: threshold }} />
                  </div>
                  <span className="text-sm font-semibold text-green-600 tabular-nums">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right column ──────────────────────────────────── */}
        <div className="space-y-6">

          {/* Setup Checklist */}
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

          {/* Quick Links */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { label: "Create a listing",    href: "/dashboard/seller/listings/new",  icon: PlusCircle   },
                { label: "View all orders",     href: "/dashboard/seller/orders",         icon: Package      },
                { label: "Manage store",        href: "/dashboard/seller/store",          icon: Store        },
                { label: "Earnings",            href: "/dashboard/seller/earnings",       icon: Wallet       },
                { label: "Analytics",           href: "/dashboard/seller/analytics",      icon: BarChart2    },
                { label: "Messages",            href: "/dashboard/seller/messages",       icon: MessageSquare},
              ].map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 group"
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500" />
                </Link>
              ))}
            </div>
          </div>

          {/* Ratings summary */}
          {ratingAgg._count.rating > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg px-5 py-4">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-gray-900">Seller Rating</h2>
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums mt-2">
                {ratingAgg._avg.rating!.toFixed(1)}
                <span className="text-sm font-normal text-gray-400"> / 5.0</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Based on {ratingAgg._count.rating} review{ratingAgg._count.rating !== 1 ? "s" : ""}
              </p>
              <Link
                href="/dashboard/seller/reviews"
                className="mt-3 text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1"
              >
                View reviews <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
