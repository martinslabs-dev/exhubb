import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  Heart,
  ShoppingBag,
  Trash2,
  Bell,
  TrendingDown,
  ArrowRight,
  Tag,
} from "lucide-react";

export const metadata: Metadata = { title: "Watchlist" };

export default async function WatchlistPage() {
  const session = await auth();

  const items = await prisma.watchlistItem.findMany({
    where: { userId: session!.user.id },
    include: {
      product: {
        select: {
          id: true, title: true, price: true, images: true, category: true, isActive: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Watchlist</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {items.length} item{items.length !== 1 ? "s" : ""} — get notified on price drops
          </p>
        </div>
        {items.length > 0 && (
          <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors px-3 py-2 rounded-xl hover:bg-red-50">
            <Trash2 className="w-3.5 h-3.5" />
            Clear All
          </button>
        )}
      </div>

      {/* ── Price alert banner ────────────────────────────── */}
      {items.length > 0 && (
        <div className="flex items-center gap-3 bg-gradient-to-r from-primary-50 to-green-50 border border-primary-100 rounded-2xl p-4">
          <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
            <Bell className="w-4 h-4 text-primary-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-primary-800">Price Drop Alerts On</p>
            <p className="text-xs text-primary-600">We&rsquo;ll notify you when prices drop on your watched items.</p>
          </div>
          <Link
            href="/dashboard/settings/notifications"
            className="text-xs font-bold text-primary-700 hover:text-primary-800 flex items-center gap-1"
          >
            Manage <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* ── Grid or empty state ───────────────────────────── */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center">
              <Heart className="w-9 h-9 text-red-200" />
            </div>
          </div>
          <p className="text-lg font-bold text-gray-700 mb-1">Your watchlist is empty</p>
          <p className="text-sm text-gray-400 mb-6 max-w-xs">
            Save items you love and get notified when their prices drop.
          </p>
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(({ id, product, createdAt }) => (
            <div
              key={id}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-primary-200 hover:shadow-md transition-all"
            >
              {/* Image */}
              <div className="relative h-44 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                {product.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Tag className="w-10 h-10 text-gray-200" />
                  </div>
                )}
                {/* Remove button */}
                <form className="absolute top-2 right-2">
                  <button
                    type="submit"
                    className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Remove from watchlist"
                  >
                    <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                  </button>
                </form>
                {/* Stock badge */}
                {!product.isActive && (
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/60 text-white text-[10px] font-bold">
                    Unavailable
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <p className="text-xs text-primary-600 font-semibold mb-1">{product.category}</p>
                <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug mb-2">
                  {product.title}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-black text-gray-900">
                      ${product.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      Watched since {new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <Link
                    href={`/products/${product.id}`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-colors"
                  >
                    Buy <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
