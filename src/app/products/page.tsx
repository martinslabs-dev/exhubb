import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import Link from "next/link";
import Image from "next/image";
import { Search, Star, Package, Zap, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import SortSelect from "./SortSelect";
import FilterDrawer from "./FilterDrawer";
import WishlistButton from "@/components/WishlistButton";

const CATEGORIES = [
  "All", "Electronics", "Fashion", "Motors", "Home & Garden",
  "Collectibles", "Sports", "Beauty", "Books", "Digital Products", "Other",
];

const ZONES = [
  { value: "NIGERIA",       label: "🇳🇬 Ships to Nigeria" },
  { value: "AFRICA",        label: "🌍 Ships to Africa" },
  { value: "INTERNATIONAL", label: "🌐 Ships Internationally" },
];

const RATINGS = [
  { value: "4", label: "4★ & up" },
  { value: "3", label: "3★ & up" },
  { value: "2", label: "2★ & up" },
];

interface Props {
  searchParams: Promise<{
    q?: string;
    category?: string;
    zone?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
    type?: string;
    rating?: string;
    inStock?: string;
    tag?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;

  const q         = params.q        ?? "";
  const category  = params.category ?? "All";
  const zone      = params.zone     ?? "";
  const minPrice  = params.minPrice ? parseFloat(params.minPrice) : undefined;
  const maxPrice  = params.maxPrice ? parseFloat(params.maxPrice) : undefined;
  const sort      = params.sort     ?? "newest";
  const page      = parseInt(params.page ?? "1");
  const type      = params.type     ?? "";
  const minRating = params.rating   ? parseFloat(params.rating) : undefined;
  const inStock   = params.inStock  === "1";
  const tag       = params.tag      ?? "";
  const perPage   = 24;

  // Pre-query: filter by min avg rating using groupBy
  let ratingFilterIds: string[] | undefined;
  if (minRating) {
    const groups = await prisma.review.groupBy({
      by: ["productId"],
      _avg: { rating: true },
      having: { rating: { _avg: { gte: minRating } } },
    });
    ratingFilterIds = groups.map((g) => g.productId);
  }

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(q ? {
      OR: [
        { title:       { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { category:    { contains: q, mode: "insensitive" } },
        { tags:        { hasSome:  q.toLowerCase().split(/\s+/).filter(Boolean) } },
      ],
    } : {}),
    ...(category && category !== "All" ? { category: { equals: category } } : {}),
    ...(tag      ? { tags: { has: tag.toLowerCase() } }                     : {}),
    ...(zone     ? { shippingZones: { has: zone as "NIGERIA" | "AFRICA" | "INTERNATIONAL" } } : {}),
    ...(type === "PHYSICAL" ? { productType: "PHYSICAL" } : {}),
    ...(type === "DIGITAL"  ? { productType: "DIGITAL"  } : {}),
    ...((minPrice !== undefined || maxPrice !== undefined) ? {
      price: {
        ...(minPrice !== undefined ? { gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
      },
    } : {}),
    ...(inStock ? { OR: [{ unlimitedStock: true }, { stock: { gt: 0 } }] } : {}),
    ...(ratingFilterIds ? { id: { in: ratingFilterIds } } : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price_asc"  ? { price: "asc" }  :
    sort === "price_desc" ? { price: "desc" } :
    sort === "oldest"     ? { createdAt: "asc" } :
    { createdAt: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip:  (page - 1) * perPage,
      take:  perPage,
      include: {
        seller:  { select: { id: true, name: true, image: true } },
        reviews: { select: { rating: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  // Wishlist state for authenticated users
  const session = await auth();
  const wishlistedIds = new Set<string>();
  if (session?.user?.id && products.length > 0) {
    const items = await prisma.watchlistItem.findMany({
      where: { userId: session.user.id, productId: { in: products.map((p) => p.id) } },
      select: { productId: true },
    });
    items.forEach((i) => wishlistedIds.add(i.productId));
  }

  function avgRating(reviews: { rating: number }[]) {
    if (!reviews.length) return null;
    return (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
  }

  function buildUrl(overrides: Record<string, string | number | undefined>) {
    const p = new URLSearchParams();
    if (q)        p.set("q",        q);
    if (category && category !== "All") p.set("category", category);
    if (zone)     p.set("zone",     zone);
    if (sort && sort !== "newest") p.set("sort", sort);
    if (minPrice) p.set("minPrice", String(minPrice));
    if (maxPrice) p.set("maxPrice", String(maxPrice));
    if (type)     p.set("type",     type);
    if (params.rating) p.set("rating", params.rating);
    if (inStock)  p.set("inStock",  "1");
    if (tag)      p.set("tag",      tag);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v !== undefined && v !== null) p.set(k, String(v));
      else p.delete(k);
    });
    const str = p.toString();
    return `/products${str ? `?${str}` : ""}`;
  }

  // Active filter chips
  const activeFilters: { label: string; clearKey: string }[] = [];
  if (q)             activeFilters.push({ label: `"${q}"`,                  clearKey: "q" });
  if (category !== "All") activeFilters.push({ label: category,             clearKey: "category" });
  if (zone)          activeFilters.push({ label: zone.charAt(0) + zone.slice(1).toLowerCase(), clearKey: "zone" });
  if (type)          activeFilters.push({ label: type === "DIGITAL" ? "Digital" : "Physical", clearKey: "type" });
  if (params.rating) activeFilters.push({ label: `${params.rating}★ & up`,  clearKey: "rating" });
  if (inStock)       activeFilters.push({ label: "In Stock",                clearKey: "inStock" });
  if (minPrice)      activeFilters.push({ label: `Min ₦${minPrice.toLocaleString()}`, clearKey: "minPrice" });
  if (maxPrice)      activeFilters.push({ label: `Max ₦${maxPrice.toLocaleString()}`, clearKey: "maxPrice" });
  if (tag)           activeFilters.push({ label: `#${tag}`,                 clearKey: "tag" });

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20">
        {/* ── Search bar ── */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <form method="GET" action="/products" className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Search by title, category, or tag..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {/* preserve other active params */}
                {category && category !== "All" && <input type="hidden" name="category" value={category} />}
                {zone    && <input type="hidden" name="zone"    value={zone} />}
                {type    && <input type="hidden" name="type"    value={type} />}
                {params.rating && <input type="hidden" name="rating" value={params.rating} />}
                {inStock && <input type="hidden" name="inStock" value="1" />}
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
          {/* ── Sidebar filters ── */}
          <aside className="hidden lg:block w-56 shrink-0 space-y-6">

            {/* Product Type */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Product Type</p>
              <div className="flex flex-col gap-1">
                {[["", "All Types"], ["PHYSICAL", "📦 Physical"], ["DIGITAL", "⚡ Digital"]].map(([v, label]) => (
                  <Link
                    key={v}
                    href={buildUrl({ type: v || undefined, page: 1 })}
                    className={cn(
                      "block px-3 py-2 rounded-lg text-sm transition-colors",
                      type === v ? "bg-primary-600 text-white font-semibold" : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Category</p>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat}
                    href={buildUrl({ category: cat === "All" ? undefined : cat, page: 1 })}
                    className={cn(
                      "block px-3 py-2 rounded-lg text-sm transition-colors",
                      (category === cat || (cat === "All" && category === "All"))
                        ? "bg-primary-600 text-white font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>

            {/* Shipping zone */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Ships To</p>
              <div className="space-y-1">
                <Link
                  href={buildUrl({ zone: undefined, page: 1 })}
                  className={cn(
                    "block px-3 py-2 rounded-lg text-sm transition-colors",
                    !zone ? "bg-primary-600 text-white font-semibold" : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  All Regions
                </Link>
                {ZONES.map((z) => (
                  <Link
                    key={z.value}
                    href={buildUrl({ zone: z.value, page: 1 })}
                    className={cn(
                      "block px-3 py-2 rounded-lg text-sm transition-colors",
                      zone === z.value ? "bg-primary-600 text-white font-semibold" : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {z.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Minimum Rating</p>
              <div className="space-y-1">
                <Link
                  href={buildUrl({ rating: undefined, page: 1 })}
                  className={cn("block px-3 py-2 rounded-lg text-sm transition-colors", !params.rating ? "bg-primary-600 text-white font-semibold" : "text-gray-700 hover:bg-gray-100")}
                >
                  Any Rating
                </Link>
                {RATINGS.map((r) => (
                  <Link
                    key={r.value}
                    href={buildUrl({ rating: r.value, page: 1 })}
                    className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors", params.rating === r.value ? "bg-primary-600 text-white font-semibold" : "text-gray-700 hover:bg-gray-100")}
                  >
                    <Star className={cn("w-3.5 h-3.5", params.rating === r.value ? "fill-white text-white" : "fill-yellow-400 text-yellow-400")} />
                    {r.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Price (₦)</p>
              <form method="GET" action="/products" className="space-y-2">
                {q        && <input type="hidden" name="q"        value={q} />}
                {category && category !== "All" && <input type="hidden" name="category" value={category} />}
                {zone     && <input type="hidden" name="zone"     value={zone} />}
                {sort     && sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
                {type     && <input type="hidden" name="type"     value={type} />}
                {params.rating && <input type="hidden" name="rating" value={params.rating} />}
                {inStock  && <input type="hidden" name="inStock"  value="1" />}
                <input
                  name="minPrice" type="number" placeholder="Min"
                  defaultValue={minPrice}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  name="maxPrice" type="number" placeholder="Max"
                  defaultValue={maxPrice}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Apply
                </button>
              </form>
            </div>

            {/* In Stock */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Availability</p>
              <Link
                href={buildUrl({ inStock: inStock ? undefined : "1", page: 1 })}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors",
                  inStock ? "bg-primary-600 text-white border-primary-600" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                )}
              >
                <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0", inStock ? "bg-white border-white" : "border-gray-400")}>
                  {inStock && <div className="w-2 h-2 bg-primary-600 rounded-sm" />}
                </div>
                In Stock Only
              </Link>
            </div>
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">
            {/* toolbar */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{total.toLocaleString()}</span> product{total !== 1 ? "s" : ""}
                {q && <span className="ml-1">for &ldquo;<span className="text-primary-600">{q}</span>&rdquo;</span>}
              </p>
              <div className="flex items-center gap-3">
                {/* mobile filter — FilterDrawer handles its own trigger */}
                <FilterDrawer />
                {/* sort */}
                <SortSelect current={sort} />
              </div>
            </div>

            {/* ── Active filter chips ── */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {activeFilters.map((f) => (
                  <Link
                    key={f.clearKey}
                    href={buildUrl({ [f.clearKey]: undefined, page: 1 })}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full border border-primary-200 hover:bg-primary-100 transition-colors"
                  >
                    {f.label}
                    <span className="w-3.5 h-3.5 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 text-[10px] leading-none">✕</span>
                  </Link>
                ))}
                {activeFilters.length > 1 && (
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Clear all
                  </Link>
                )}
              </div>
            )}

            {/* grid */}
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Package className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-lg font-semibold text-gray-800">No products found</p>
                <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
                <Link href="/products" className="mt-4 text-sm text-primary-600 hover:underline">Clear all filters</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => {
                  const avg = avgRating(product.reviews);
                  const img = product.images[0];
                  const isDigital = product.productType === "DIGITAL";
                  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;
                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-primary-200 transition-all"
                    >
                      {/* image */}
                      <div className="aspect-square bg-gray-100 relative overflow-hidden">
                        {img ? (
                          <Image
                            src={img}
                            alt={product.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            {isDigital
                              ? <Zap className="w-10 h-10 text-indigo-300" />
                              : <Package className="w-10 h-10 text-gray-300" />
                            }
                          </div>
                        )}
                        {/* top-left badges */}
                        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                          {onSale && (
                            <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">SALE</span>
                          )}
                          {!isDigital && product.shippingZones.includes("NIGERIA") && <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-medium">🇳🇬 NG</span>}
                          {!isDigital && product.shippingZones.includes("AFRICA") && <span className="text-[10px] bg-yellow-500 text-white px-1.5 py-0.5 rounded-full font-medium">🌍 AF</span>}
                          {!isDigital && product.shippingZones.includes("INTERNATIONAL") && <span className="text-[10px] bg-primary-500 text-white px-1.5 py-0.5 rounded-full font-medium">🌐 INT</span>}
                        </div>
                        {/* top-right: digital badge */}
                        {isDigital && (
                          <div className="absolute top-2 right-2">
                            <span className="flex items-center gap-0.5 text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                              <Zap className="w-2.5 h-2.5" /> Digital
                            </span>
                          </div>
                        )}
                        {/* Wishlist heart */}
                        <div className="absolute bottom-2 right-2">
                          <WishlistButton
                            productId={product.id}
                            initialWishlisted={wishlistedIds.has(product.id)}
                          />
                        </div>
                      </div>
                      {/* info */}
                      <div className="p-3">
                        <p className="text-xs text-gray-500 truncate">{product.category}</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5 line-clamp-2 leading-snug">{product.title}</p>
                        <div className="flex items-baseline gap-2 mt-2">
                          <p className="text-base font-bold text-primary-600">
                            ₦{product.price.toLocaleString()}
                          </p>
                          {onSale && (
                            <p className="text-xs text-gray-400 line-through">
                              ₦{product.compareAtPrice!.toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          {avg ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                              <span className="text-xs text-gray-600">{avg} ({product.reviews.length})</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No reviews</span>
                          )}
                          {/* tag chips (show first one) */}
                          {product.tags[0] && (
                            <Link
                              href={buildUrl({ tag: product.tags[0], page: 1 })}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-0.5 text-[10px] text-primary-600 hover:underline"
                            >
                              <Tag className="w-2.5 h-2.5" />
                              {product.tags[0]}
                            </Link>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                {page > 1 && (
                  <Link href={buildUrl({ page: page - 1 })} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition">← Prev</Link>
                )}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return (
                    <Link
                      key={p}
                      href={buildUrl({ page: p })}
                      className={cn(
                        "w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium border transition",
                        p === page
                          ? "bg-primary-600 text-white border-primary-600"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      {p}
                    </Link>
                  );
                })}
                {page < totalPages && (
                  <Link href={buildUrl({ page: page + 1 })} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition">Next →</Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
