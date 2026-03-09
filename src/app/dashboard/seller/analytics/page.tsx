import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  TrendingUp,
  ShoppingBag,
  Star,
  Package,
  BarChart3,
  Users,
  Repeat2,
} from "lucide-react";

export const metadata: Metadata = { title: "Seller Analytics" };

export default async function SellerAnalyticsPage() {
  const session = await auth();
  const userId  = session!.user.id;

  // â”€â”€ Six months window â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [completedOrders, totalListings, totalProducts, revenueAgg, avgRatingAgg, recentOrders, allOrders] = await Promise.all([
    prisma.order.count({
      where: { sellerId: userId, status: { in: ["COMPLETED", "DELIVERED"] } },
    }),
    prisma.product.count({ where: { sellerId: userId } }),
    prisma.product.count({ where: { sellerId: userId, isActive: true } }),
    prisma.order.aggregate({
      where: { sellerId: userId, status: { in: ["COMPLETED", "DELIVERED"] } },
      _sum: { amount: true },
    }),
    prisma.review.aggregate({
      where: { product: { sellerId: userId } },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    prisma.order.findMany({
      where: { sellerId: userId, status: { in: ["COMPLETED", "DELIVERED"] }, createdAt: { gte: sixMonthsAgo } },
      select: { amount: true, createdAt: true },
    }),
    prisma.order.findMany({
      where: { sellerId: userId, status: { in: ["COMPLETED", "DELIVERED"] } },
      select: { buyerId: true },
    }),
  ]);

  const revenue = revenueAgg._sum.amount ?? 0;
  const avgRating = avgRatingAgg._avg.rating;
  const reviewCount = avgRatingAgg._count.rating;

  // â”€â”€ Repeat buyers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const buyerCounts = allOrders.reduce<Record<string, number>>((acc, o) => {
    acc[o.buyerId] = (acc[o.buyerId] ?? 0) + 1;
    return acc;
  }, {});
  const repeatBuyers = Object.values(buyerCounts).filter((c) => c > 1).length;

  // â”€â”€ Monthly revenue buckets (last 6 calendar months) â”€â”€â”€â”€â”€
  const monthBuckets: { label: string; revenue: number; orders: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    monthBuckets.push({
      label: d.toLocaleString("en-US", { month: "short" }),
      revenue: 0,
      orders: 0,
    });
  }

  for (const o of recentOrders) {
    const monthLabel = new Date(o.createdAt).toLocaleString("en-US", { month: "short" });
    const bucket = monthBuckets.find((b) => b.label === monthLabel);
    if (bucket) { bucket.revenue += o.amount; bucket.orders += 1; }
  }

  const maxRevenue = Math.max(...monthBuckets.map((b) => b.revenue), 1);

  // â”€â”€ Top products â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const topProductsRaw = await prisma.order.groupBy({
    by: ["productId"],
    where: { sellerId: userId, status: { in: ["COMPLETED", "DELIVERED"] }, productId: { not: null } },
    _sum:   { amount: true },
    _count: { id: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 5,
  });

  const productIds = topProductsRaw.map((p) => p.productId!).filter(Boolean);
  const products = productIds.length
    ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, title: true, images: true } })
    : [];

  const topProducts = topProductsRaw.map((p) => ({
    ...p,
    product: products.find((pr) => pr.id === p.productId),
  })).filter((p) => p.product);

  const STATS = [
    { label: "Total Revenue",    value: `₦${revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: "All time",        icon: TrendingUp,        color: "text-green-600",  bg: "bg-green-50"  },
    { label: "Orders Completed", value: completedOrders,          sub: "Fulfilled orders", icon: ShoppingBag,       color: "text-blue-600",   bg: "bg-blue-50"   },
    { label: "Active Listings",  value: totalProducts,            sub: `${totalListings} total`, icon: Package,    color: "text-indigo-600", bg: "bg-indigo-50" },
    {
      label: "Avg. Rating",
      value: avgRating ? avgRating.toFixed(1) : "–",
      sub: reviewCount ? `${reviewCount} review${reviewCount !== 1 ? "s" : ""}` : "No reviews yet",
      icon: Star, color: "text-amber-500", bg: "bg-amber-50",
    },
  ];

  const PERFORMANCE = [
    { label: "Repeat Buyers",  value: repeatBuyers > 0 ? String(repeatBuyers) : "–", icon: Repeat2 },
    { label: "Unique Buyers",  value: Object.keys(buyerCounts).length > 0 ? String(Object.keys(buyerCounts).length) : "–", icon: Users },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl mx-auto space-y-6">

      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your store performance</p>
        </div>
      </div>

      {/* â”€â”€ Stats grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

      {/* â”€â”€ Revenue Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-black text-gray-900">Revenue Over Time</h2>
            <p className="text-xs text-gray-400 mt-0.5">Monthly revenue – last 6 months</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary-500" />
            <span className="text-xs text-gray-500">Revenue (₦)</span>
          </div>
        </div>

        {revenue === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <BarChart3 className="w-10 h-10 text-gray-100 mb-3" />
            <p className="text-sm font-semibold text-gray-400">No revenue data yet</p>
            <p className="text-xs text-gray-400 mt-1">Complete your first order to see revenue trends.</p>
          </div>
        ) : (
          <div className="flex items-end gap-2 h-40">
            {monthBuckets.map((b, i) => {
              const barPx = b.revenue > 0 ? Math.max(Math.round((b.revenue / maxRevenue) * 120), 4) : 0;
              const tipLabel = b.revenue >= 1000
                ? `₦${(b.revenue / 1000).toFixed(b.revenue >= 10000 ? 0 : 1)}k`
                : `₦${b.revenue.toLocaleString()}`;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full flex flex-col items-center">
                    {b.revenue > 0 && (
                      <span className="absolute -top-5 text-[10px] font-bold text-primary-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {tipLabel}
                      </span>
                    )}
                    <div
                      className="w-full bg-primary-100 hover:bg-primary-300 rounded-lg transition-colors"
                      style={{ height: `${barPx}px` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{b.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* â”€â”€ Buyer Metrics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-base font-black text-gray-900 mb-4">Buyer Metrics</h2>
          <div className="space-y-3">
            {PERFORMANCE.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* â”€â”€ Top Products â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-base font-black text-gray-900 mb-4">Top Products by Revenue</h2>
          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-36 text-center">
              <Package className="w-9 h-9 text-gray-100 mb-3" />
              <p className="text-sm font-semibold text-gray-400">Not enough data yet</p>
              <p className="text-xs text-gray-400 mt-1">Top sellers will appear once you have completed orders.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className="text-xs font-black text-gray-300 w-4">{i + 1}</span>
                  {p.product!.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.product!.images[0]} alt="" className="w-9 h-9 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{p.product!.title}</p>
                    <p className="text-xs text-gray-400">{p._count.id} order{p._count.id !== 1 ? "s" : ""}</p>
                  </div>
                  <span className="text-sm font-bold text-primary-700">₦{((p._sum.amount ?? 0) / 1000).toFixed(0)}k</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* â”€â”€ Order Volume chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-base font-black text-gray-900 mb-1">Order Volume</h2>
        <p className="text-xs text-gray-400 mb-5">Number of orders per month – last 6 months</p>
        {monthBuckets.every((b) => b.orders === 0) ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <BarChart3 className="w-8 h-8 text-gray-100 mb-3" />
            <p className="text-sm font-semibold text-gray-400">No order data yet</p>
          </div>
        ) : (
          <div className="flex items-end gap-2 h-32">
            {(() => {
              const maxOrders = Math.max(...monthBuckets.map((b) => b.orders), 1);
              return monthBuckets.map((b, i) => {
                const barPx = b.orders > 0 ? Math.max(Math.round((b.orders / maxOrders) * 96), 4) : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="relative w-full flex flex-col items-center">
                      {b.orders > 0 && (
                        <span className="absolute -top-5 text-[10px] font-bold text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity">
                          {b.orders}
                        </span>
                      )}
                      <div
                        className="w-full bg-indigo-100 hover:bg-indigo-300 rounded-lg transition-colors"
                        style={{ height: `${barPx}px` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{b.label}</span>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
}


