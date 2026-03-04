import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import {
  Bookmark,
  ShoppingBag,
  Briefcase,
  Trash2,
  ArrowRight,
  Tag,
  Clock,
} from "lucide-react";

export const metadata: Metadata = { title: "Saved Items" };

type FilterType = "all" | "products" | "gigs";

export default async function SavedItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await auth();
  const params  = await searchParams;
  const filter  = (params.filter ?? "all") as FilterType;

  const items = await prisma.savedItem.findMany({
    where: {
      userId: session!.user.id,
      ...(filter === "products" && { gigId: null }),
      ...(filter === "gigs"     && { productId: null }),
    },
    include: {
      product: { select: { id: true, title: true, price: true, images: true, category: true } },
      gig:     { select: { id: true, title: true, basicPrice: true, category: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const FILTERS: { id: FilterType; label: string }[] = [
    { id: "all",      label: "All Saved" },
    { id: "products", label: "Products"  },
    { id: "gigs",     label: "Services"  },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Saved Items</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {items.length} saved item{items.length !== 1 ? "s" : ""}
          </p>
        </div>
        {items.length > 0 && (
          <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors px-3 py-2 rounded-xl hover:bg-red-50">
            <Trash2 className="w-3.5 h-3.5" />
            Clear All
          </button>
        )}
      </div>

      {/* ── Filter tabs ───────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        {FILTERS.map(({ id, label }) => (
          <Link
            key={id}
            href={`/dashboard/buyer/saved?filter=${id}`}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold transition-all",
              filter === id
                ? "bg-primary-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* ── Grid or empty state ───────────────────────────── */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-amber-50 flex items-center justify-center mb-5">
            <Bookmark className="w-9 h-9 text-amber-200" />
          </div>
          <p className="text-lg font-bold text-gray-700 mb-1">
            {filter === "all" ? "Nothing saved yet" : `No saved ${filter} yet`}
          </p>
          <p className="text-sm text-gray-400 mb-6 max-w-xs">
            Bookmark products and freelancer gigs to find them quickly later.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Browse Products
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors"
            >
              <Briefcase className="w-4 h-4" />
              Browse Services
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(({ id, product, gig, createdAt }) => {
            const isProduct = !!product;
            const itemTitle  = product?.title ?? gig?.title ?? "";
            const itemPrice  = product?.price ?? gig?.basicPrice ?? 0;
            const category   = product?.category ?? gig?.category ?? "";
            const thumb      = product?.images?.[0];
            const itemId     = product?.id ?? gig?.id ?? "";
            const href       = isProduct ? `/products/${itemId}` : `/services/${itemId}`;

            return (
              <div
                key={id}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-primary-200 hover:shadow-md transition-all"
              >
                {/* Image / placeholder */}
                <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt={itemTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {isProduct
                        ? <Tag      className="w-10 h-10 text-gray-200" />
                        : <Briefcase className="w-10 h-10 text-gray-200" />}
                    </div>
                  )}
                  {/* Type badge */}
                  <div className={cn(
                    "absolute top-2 left-2 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1",
                    isProduct ? "bg-primary-600 text-white" : "bg-gold-500 text-white"
                  )}>
                    {isProduct
                      ? <><ShoppingBag className="w-2.5 h-2.5" /> Product</>
                      : <><Briefcase   className="w-2.5 h-2.5" /> Service</>}
                  </div>
                  {/* Remove */}
                  <form className="absolute top-2 right-2">
                    <button
                      type="submit"
                      className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-red-50 transition-colors"
                    >
                      <Bookmark className="w-3 h-3 text-amber-500 fill-amber-400" />
                    </button>
                  </form>
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="text-xs text-primary-600 font-semibold mb-1">{category}</p>
                  <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug mb-2">
                    {itemTitle}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-black text-gray-900">
                        {isProduct ? `$${itemPrice.toFixed(2)}` : `From $${itemPrice.toFixed(2)}`}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <Link
                      href={href}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-colors"
                    >
                      View <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
