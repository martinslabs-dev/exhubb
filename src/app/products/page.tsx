import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import Link from "next/link";
import TagLink from "@/components/TagLink";
import Image from "next/image";
import { Search, Star, Package, Zap, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import SortSelect from "./SortSelect";
import FilterDrawer from "./FilterDrawer";
import WishlistButton from "@/components/WishlistButton";
import taxonomy from "@/lib/taxonomy.json";

const CATEGORIES: string[] = [
  "All",
  ...Array.from(new Set(
    taxonomy.menu.flatMap((m: any) => m.columns.map((c: any) => c.heading))
  )),
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
    subcategory?: string;
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
  const subcategory = params.subcategory ?? "";
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
    ...(subcategory ? { subcategory: { equals: subcategory } } : {}),
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

  // Build subcategory list for the selected category (used for desktop sidebar)
  let subcategoriesList: string[] = [];
  if (category && category !== "All") {
    for (const m of taxonomy.menu as any[]) {
      for (const col of m.columns as any[]) {
        if (col.heading === category) {
          for (const item of col.items || []) {
            if (item.label) subcategoriesList.push(item.label);
            if (item.children) subcategoriesList.push(...(item.children as any[]).map((c) => c.label));
          }
        }
      }
    }
    subcategoriesList = Array.from(new Set(subcategoriesList));
  }

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
    if (subcategory) p.set("subcategory", subcategory);
    if (params.rating) p.set("rating", params.rating);
    if (inStock)  p.set("inStock",  "1");
    if (tag)      p.set("tag",      tag);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v !== undefined && v !== null) p.set(k, String(v));
      else p.delete(k);
    });
    // If caller changed category via overrides and didn't explicitly set subcategory, clear it
    if (Object.prototype.hasOwnProperty.call(overrides, "category") && !Object.prototype.hasOwnProperty.call(overrides, "subcategory")) {
      const newCat = overrides["category"];
      if (newCat !== undefined && newCat !== null) p.delete("subcategory");
    }
    // If caller changed type via overrides (switching between PHYSICAL/DIGITAL), clear subcategory
    if (Object.prototype.hasOwnProperty.call(overrides, "type") && !Object.prototype.hasOwnProperty.call(overrides, "subcategory")) {
      const newType = overrides["type"];
      if (newType !== undefined && newType !== null) p.delete("subcategory");
    }
    const str = p.toString();
    return `/products${str ? `?${str}` : ""}`;
  }

  // Active filter chips
  const activeFilters: { label: string; clearKey: string }[] = [];
  if (q)             activeFilters.push({ label: `"${q}"`,                  clearKey: "q" });
  if (category !== "All") activeFilters.push({ label: category,             clearKey: "category" });
  if (zone)          activeFilters.push({ label: zone.charAt(0) + zone.slice(1).toLowerCase(), clearKey: "zone" });
  if (type)          activeFilters.push({ label: type === "DIGITAL" ? "Digital" : "Physical", clearKey: "type" });
  if (subcategory)   activeFilters.push({ label: subcategory, clearKey: "subcategory" });
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
          {/* desktop: enhanced sidebar + main */}
          <aside className="hidden lg:block w-80 self-start sticky top-24">
            <div className="space-y-4">
              {/* Product Type (prominent) */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <h3 className="text-sm font-semibold mb-3">Product Type</h3>
                <div className="flex gap-2">
                  <Link
                    href={buildUrl({ type: undefined, page: 1 })}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium border text-center",
                      !type ? "bg-primary-600 text-white border-primary-600" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    All
                  </Link>
                </div>
                {!type && (
                  <p className="text-xs text-gray-500 mt-2">Showing both physical and digital products</p>
                )}
              </div>

              {/* Categories: hierarchical, collapsible */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <h3 className="text-sm font-semibold mb-3">Categories</h3>
                <div className="space-y-2">
                  {taxonomy.menu.map((m: any, mi: number) => (
                    <div key={mi} className="border-b last:border-b-0 pb-3">
                      {m.columns.map((col: any, ci: number) => (
                        <details key={ci} className="group" open={col.heading === category}>
                          <summary className={cn("cursor-pointer list-none text-sm font-semibold px-2 py-1 rounded-md", col.heading === category ? "text-primary-700" : "text-gray-800 hover:text-primary-600")}>{col.heading}</summary>
                          <div className="mt-2 ml-2">
                            <div className="mb-2">
                              <Link href={buildUrl({ category: col.heading, subcategory: undefined, page: 1 })} className="text-xs text-gray-500 hover:underline">View all {col.heading}</Link>
                            </div>
                            <ul className="space-y-1">
                              {(col.items || []).map((it: any, ii: number) => (
                                <li key={ii} className="pl-2">
                                  <Link
                                    href={buildUrl({ category: col.heading, subcategory: it.title, page: 1 })}
                                    className={cn(
                                      "text-sm block px-2 py-1 rounded-md",
                                      subcategory === it.title && category === col.heading ? "bg-primary-50 text-primary-700" : "text-gray-700 hover:bg-gray-50"
                                    )}
                                  >
                                    {it.title}
                                  </Link>
                                  {it.children && (
                                    <ul className="ml-3 mt-1 space-y-1">
                                      {it.children.map((ch: any, chi: number) => (
                                        <li key={chi}>
                                          <Link
                                            href={buildUrl({ category: col.heading, subcategory: ch.title, page: 1 })}
                                            className={cn(
                                              "text-sm block px-2 py-1 rounded-md text-gray-600",
                                              subcategory === ch.title && category === col.heading ? "bg-primary-50 text-primary-700" : "hover:bg-gray-50"
                                            )}
                                          >
                                            ↳ {ch.title}
                                          </Link>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </details>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Facets: Ships To, Rating, Price, Availability */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="space-y-4">
                  <details className="group" open>
                    <summary className="cursor-pointer text-sm font-semibold">Ships To</summary>
                    <div className="mt-2 space-y-2">
                      <Link href={buildUrl({ zone: undefined, page: 1 })} className={cn("block text-sm px-2 py-1 rounded-md", !zone ? "bg-primary-50 text-primary-700" : "text-gray-700 hover:bg-gray-50")}>
                        All Regions
                      </Link>
                      {ZONES.map((z) => (
                        <Link key={z.value} href={buildUrl({ zone: z.value, page: 1 })} className={cn("block text-sm px-2 py-1 rounded-md", zone === z.value ? "bg-primary-50 text-primary-700" : "text-gray-700 hover:bg-gray-50")}>
                          {z.label}
                        </Link>
                      ))}
                    </div>
                  </details>

                  <details className="group">
                    <summary className="cursor-pointer text-sm font-semibold">Minimum Rating</summary>
                    <div className="mt-2 space-y-2">
                      <Link href={buildUrl({ rating: undefined, page: 1 })} className={cn("block text-sm px-2 py-1 rounded-md", !params.rating ? "bg-primary-50 text-primary-700" : "text-gray-700 hover:bg-gray-50")}>
                        Any Rating
                      </Link>
                      {RATINGS.map((r) => (
                        <Link key={r.value} href={buildUrl({ rating: r.value, page: 1 })} className={cn("block text-sm px-2 py-1 rounded-md", params.rating === r.value ? "bg-primary-50 text-primary-700" : "text-gray-700 hover:bg-gray-50")}>
                          {r.label}
                        </Link>
                      ))}
                    </div>
                  </details>

                  <details className="group">
                    <summary className="cursor-pointer text-sm font-semibold">Price</summary>
                    <div className="mt-2">
                      <form
                        method="GET"
                        action="/products"
                        className="space-y-2"
                      >
                        <input name="category" type="hidden" value={category === "All" ? "" : category} />
                        <input name="minPrice" type="number" placeholder="Min" defaultValue={minPrice ?? ""} className="w-full px-2 py-1 rounded border border-gray-200 text-sm" />
                        <input name="maxPrice" type="number" placeholder="Max" defaultValue={maxPrice ?? ""} className="w-full px-2 py-1 rounded border border-gray-200 text-sm" />
                        <button type="submit" className="w-full py-2 mt-1 bg-gray-900 text-white text-sm font-semibold rounded-lg">Apply</button>
                      </form>
                    </div>
                  </details>

                  <details className="group">
                    <summary className="cursor-pointer text-sm font-semibold">Availability</summary>
                    <div className="mt-2">
                      <Link href={buildUrl({ inStock: inStock ? undefined : "1", page: 1 })} className={cn("block text-sm px-2 py-1 rounded-md", inStock ? "bg-primary-50 text-primary-700" : "text-gray-700 hover:bg-gray-50")}>
                        In Stock Only
                      </Link>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {/* Page title */}
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Browse {type ? (type === "DIGITAL" ? "Digital" : "Physical") : "All"} Products
              </h1>
              {!type && (
                <p className="text-sm text-gray-500 mt-1">Includes both physical and digital products.</p>
              )}
            </div>
            {/* toolbar */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{total.toLocaleString()}</span> product{total !== 1 ? "s" : ""}
                {q && <span className="ml-1">for &ldquo;<span className="text-primary-600">{q}</span>&rdquo;</span>}
              </p>
              <div className="hidden sm:flex items-center gap-3">
                <SortSelect current={sort} />
              </div>
            </div>

            {/* Mobile controls: filters + sort */}
            <div className="lg:hidden flex items-center gap-3 mb-4">
              <FilterDrawer />
              <div className="flex-1">
                <SortSelect current={sort} />
              </div>
            </div>

            

            {/* active chips */}
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
                  <Link href="/products" className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors">Clear all</Link>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
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
                      <div className="h-56 sm:aspect-square bg-gray-100 relative overflow-hidden">
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
                          <p className="text-base font-bold text-primary-600">₦{product.price.toLocaleString()}</p>
                          {onSale && (
                            <p className="text-xs text-gray-400 line-through">₦{product.compareAtPrice!.toLocaleString()}</p>
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
                            <TagLink
                              href={buildUrl({ tag: product.tags[0], page: 1 })}
                              className="flex items-center gap-0.5 text-[10px] text-primary-600 hover:underline"
                            >
                              <Tag className="w-2.5 h-2.5" />
                              {product.tags[0]}
                            </TagLink>
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
