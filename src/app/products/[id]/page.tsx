import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import {
  Star, MapPin, Package, Truck, Shield,
  ChevronRight, Clock, CheckCircle2, Store,
  BadgeCheck, Zap, RotateCcw, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import AddToCartButton from "./AddToCartButton";
import BuyNowButton from "./BuyNowButton";
import ProductImageGallery from "./ProductImageGallery";
import WriteReviewForm from "./WriteReviewForm";
import WishlistButton from "@/components/WishlistButton";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  const [product, verifiedBuyerIds, myEligibleOrder, myExistingReview, myWatchlistItem] = await Promise.all([
    prisma.product.findUnique({
      where: { id, isActive: true },
      include: {
        seller: {
          select: {
            id: true, name: true, image: true, location: true,
            createdAt: true, isSellerVerified: true,
            sellerOrders: { select: { id: true } },
          },
        },
        reviews: {
          include: { reviewer: { select: { name: true, image: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        variants: { orderBy: { name: "asc" } },
      },
    }),
    prisma.order
      .findMany({
        where: { productId: id, status: { in: ["DELIVERED", "COMPLETED"] } },
        select: { buyerId: true },
      })
      .then((rows) => new Set(rows.map((r) => r.buyerId))),
    // The logged-in user's most recent completed/delivered order for this product
    session?.user?.id
      ? prisma.order.findFirst({
          where: {
            productId: id,
            buyerId: session.user.id,
            status: { in: ["DELIVERED", "COMPLETED"] },
          },
          select: { id: true },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve(null),
    // Current user's existing review (if any)
    session?.user?.id
      ? prisma.review.findUnique({
          where: { productId_reviewerId: { productId: id, reviewerId: session.user.id } },
          select: { rating: true, comment: true },
        })
      : Promise.resolve(null),
    // Wishlist state
    session?.user?.id
      ? prisma.watchlistItem.findUnique({
          where: { userId_productId: { userId: session.user.id, productId: id } },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  if (!product) notFound();

  const avgRating = product.reviews.length
    ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
    : null;

  // Star distribution for bar chart
  const starCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: product.reviews.filter((r) => r.rating === star).length,
    pct: product.reviews.length
      ? Math.round((product.reviews.filter((r) => r.rating === star).length / product.reviews.length) * 100)
      : 0,
  }));

  // Savings
  const savings =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  // Group variants by name (e.g., "Size", "Color")
  const variantGroups = product.variants.reduce<Record<string, typeof product.variants>>(
    (acc, v) => { (acc[v.name] ??= []).push(v); return acc; },
    {}
  );

  const inStock = product.unlimitedStock || product.stock > 0;
  const isLowStock = !product.unlimitedStock && product.stock > 0 && product.stock <= product.lowStockThreshold;

  const shippingOptions = [
    ...(product.shippingZones.includes("NIGERIA") ? [{
      icon: "🇳🇬",
      label: "Nigeria",
      fee: product.nigeriaFee ?? 0,
      couriers: "GIG Logistics · Sendbox · Kwik",
      eta: "1–3 business days",
    }] : []),
    ...(product.shippingZones.includes("AFRICA") ? [{
      icon: "🌍",
      label: "Africa",
      fee: product.africaFee ?? 0,
      couriers: "DHL Express · Aramex",
      eta: "3–7 business days",
    }] : []),
    ...(product.shippingZones.includes("INTERNATIONAL") ? [{
      icon: "🌐",
      label: "International",
      fee: product.internationalFee ?? 0,
      couriers: "DHL · FedEx · UPS",
      eta: "7–14 business days",
    }] : []),
  ];

  const sellerSince = new Date(product.seller.createdAt).getFullYear();
  const totalSales  = product.seller.sellerOrders.length;

  return (
    <>
      <Navbar />
      {/* JSON-LD structured data for Product */}
      <Script id={`jsonld-product-${product.id}`} type="application/ld+json" strategy="afterInteractive">
        {`{
          "@context": "https://schema.org",
          "@type": "Product",
          "@id": "${(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.example.com") + `/products/${product.id}`}",
          "name": "${(product.title ?? "").replace(/"/g, '\\"')}",
          "image": ${JSON.stringify(product.images.length ? product.images : [])},
          "description": "${(product.description ?? "").replace(/"/g, '\\"')}",
          "sku": "${product.id}",
          "brand": { "@type": "Organization", "name": "${(product.seller.name ?? "").replace(/"/g, '\\"')}" },
          "offers": {
            "@type": "Offer",
            "url": "${(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.example.com") + `/products/${product.id}`}",
            "priceCurrency": "NGN",
            "price": "${product.price}",
            "availability": "${inStock ? "http://schema.org/InStock" : "http://schema.org/OutOfStock"}"
          },
          "aggregateRating": ${product.reviews.length ? `{"@type":"AggregateRating","ratingValue":"${avgRating!.toFixed(1)}","reviewCount":"${product.reviews.length}"}` : "null"}
        }`}
      </Script>
      <div className="min-h-screen bg-gray-50 pt-20">
        {/* breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary-600">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/products" className="hover:text-primary-600">Products</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href={`/products?category=${product.category}`} className="hover:text-primary-600">{product.category}</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium truncate max-w-xs">{product.title}</span>
          </nav>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* ── Left: Images ── */}
            <div className="space-y-3">
              <ProductImageGallery images={product.images} title={product.title} />
            </div>

            {/* ── Right: Info ── */}
            <div className="space-y-5">
              {/* Category badge + verified */}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-100">
                    {product.category}
                  </span>
                  {product.seller.isSellerVerified && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" /> Verified Seller
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-black text-gray-900 mt-2.5 leading-tight">{product.title}</h1>
                <div className="flex items-center flex-wrap gap-3 mt-2">
                  {avgRating ? (
                    <div className="flex items-center gap-1.5">
                      <div className="flex">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={cn("w-4 h-4", s <= Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200 fill-gray-200")} />
                        ))}
                      </div>
                      <span className="text-sm font-bold text-gray-800">{avgRating.toFixed(1)}</span>
                      <a href="#reviews" className="text-sm text-primary-600 hover:underline">
                        ({product.reviews.length} review{product.reviews.length !== 1 ? "s" : ""})
                      </a>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">No reviews yet</span>
                  )}
                  {product.seller.sellerOrders.length > 0 && (
                    <>
                      <span className="text-gray-200">|</span>
                      <span className="text-sm text-gray-500">{product.seller.sellerOrders.length.toLocaleString()}+ sold</span>
                    </>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Price */}
              <div>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-4xl font-black text-gray-900">₦{product.price.toLocaleString()}</span>
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <span className="text-lg text-gray-400 line-through">₦{product.compareAtPrice.toLocaleString()}</span>
                  )}
                  {savings && (
                    <span className="text-sm font-bold text-white bg-red-500 px-2.5 py-0.5 rounded-lg">
                      -{savings}% OFF
                    </span>
                  )}
                </div>
                {savings && (
                  <p className="text-sm text-green-600 font-semibold mt-1">
                    You save ₦{(product.compareAtPrice! - product.price).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Variants */}
              {Object.keys(variantGroups).length > 0 && (
                <div className="space-y-3">
                  {Object.entries(variantGroups).map(([groupName, variants]) => (
                    <div key={groupName}>
                      <p className="text-sm font-bold text-gray-700 mb-2">{groupName}:</p>
                      <div className="flex flex-wrap gap-2">
                        {variants.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            disabled={v.stock === 0}
                            className={cn(
                              "px-3.5 py-1.5 rounded-lg border text-sm font-medium transition-all",
                              v.stock === 0
                                ? "border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed line-through"
                                : "border-gray-300 text-gray-700 hover:border-primary-500 hover:text-primary-700 hover:bg-primary-50 cursor-pointer"
                            )}
                          >
                            {v.value}
                            {v.price && v.price !== product.price && (
                              <span className="ml-1 text-xs text-gray-400">(+₦{(v.price - product.price).toLocaleString()})</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Stock status */}
              <div>
                {product.unlimitedStock ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600">
                    <CheckCircle2 className="w-4 h-4" /> In Stock
                  </span>
                ) : product.stock === 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-500">
                    <Package className="w-4 h-4" /> Out of Stock
                  </span>
                ) : isLowStock ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-500">
                    <Zap className="w-4 h-4" /> Only {product.stock} left — order soon!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600">
                    <CheckCircle2 className="w-4 h-4" /> In Stock ({product.stock} available)
                  </span>
                )}
              </div>

              {/* Shipping options */}
              {shippingOptions.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <p className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                    <Truck className="w-4 h-4 text-primary-500" /> Shipping Options
                  </p>
                  <div className="space-y-3">
                    {shippingOptions.map((opt) => (
                      <div key={opt.label} className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{opt.icon} {opt.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{opt.couriers}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" /> {opt.eta}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-primary-700 shrink-0 ml-4">
                          {opt.fee === 0 ? <span className="text-green-600 font-bold">Free</span> : `₦${opt.fee.toLocaleString()}`}
                        </p>
                      </div>
                    ))}
                  </div>
                  {product.shipsFromCity && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-3 pt-3 border-t border-gray-50">
                      <MapPin className="w-3 h-3" /> Ships from {product.shipsFromCity}{product.shipsFromCountry ? `, ${product.shipsFromCountry}` : ""}
                    </p>
                  )}
                </div>
              )}

              {/* CTA buttons */}
              <div className="space-y-3">
                {session?.user ? (
                  <>
                    <BuyNowButton
                      productId={product.id}
                      stock={product.unlimitedStock ? 99 : product.stock}
                      className={cn(
                        "w-full",
                        inStock
                          ? ""
                          : "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
                      )}
                    />
                    <AddToCartButton
                      productId={product.id}
                      stock={product.unlimitedStock ? 99 : product.stock}
                      className="w-full"
                    />
                    <WishlistButton
                      productId={product.id}
                      initialWishlisted={!!myWatchlistItem}
                      variant="button"
                    />
                  </>
                ) : (
                  <Link
                    href={`/login?callbackUrl=/products/${product.id}`}
                    className="w-full flex items-center justify-center py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition-all"
                  >
                    Sign in to Purchase
                  </Link>
                )}
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Shield, label: "Buyer Protection" },
                  { icon: RotateCcw, label: "30-day Returns" },
                  { icon: Lock, label: "Secure Payment" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                    <Icon className="w-[18px] h-[18px] text-primary-500" />
                    <span className="text-[11px] font-semibold text-gray-600">{label}</span>
                  </div>
                ))}
              </div>

              {/* Seller card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Sold by</p>
                <Link href={`/sellers/${product.seller.id}`} className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700 text-sm shrink-0 overflow-hidden">
                    {product.seller.image
                      ? <Image src={product.seller.image} alt={product.seller.name ?? ""} width={40} height={40} className="rounded-full object-cover" />
                      : (product.seller.name?.[0] ?? "S").toUpperCase()
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                        {product.seller.name ?? "Seller"}
                      </p>
                      {product.seller.isSellerVerified && (
                        <BadgeCheck className="w-4 h-4 text-primary-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {totalSales.toLocaleString()} sales · Since {sellerSince}
                      {product.seller.location ? ` · ${product.seller.location}` : ""}
                    </p>
                  </div>
                  <Store className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors shrink-0" />
                </Link>
              </div>
            </div>
          </div>

          {/* ── About this item (tags) ── */}
          {product.tags.length > 0 && (
            <div className="mt-10 bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">About this item</h2>
              <ul className="space-y-2.5">
                {product.tags.map((tag) => (
                  <li key={tag} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-[7px] shrink-0" />
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Description ── */}
          {product.description && (
            <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Product Description</h2>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}

          {/* ── Product Specs ── */}
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Product Details</h2>
            <table className="w-full text-sm">
              <tbody>
                {([
                  { label: "Category",   value: product.category },
                  { label: "Condition",  value: "Brand New" },
                  product.weight         ? { label: "Weight",      value: `${product.weight} kg` } : null,
                  product.shipsFromCity  ? { label: "Ships from",  value: `${product.shipsFromCity}${product.shipsFromCountry ? `, ${product.shipsFromCountry}` : ""}` } : null,
                  { label: "Date listed", value: new Date(product.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }) },
                  { label: "Product ID",  value: product.id.slice(0, 12).toUpperCase() },
                ] as Array<{ label: string; value: string } | null>)
                  .filter((r): r is { label: string; value: string } => r !== null)
                  .map(({ label, value }) => (
                    <tr key={label} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 pr-6 font-semibold text-gray-500 w-1/3 align-top">{label}</td>
                      <td className="py-2.5 text-gray-800">{value}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* ── Reviews ── */}
          <div id="reviews" className="mt-6 bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              Customer Reviews
              {product.reviews.length > 0 && (
                <span className="text-gray-400 font-normal text-base ml-1">({product.reviews.length})</span>
              )}
            </h2>

            {product.reviews.length > 0 ? (
              <>
                {/* ── Rating summary + bar chart ── */}
                <div className="flex flex-col sm:flex-row gap-6 pb-6 border-b border-gray-100 mb-6">
                  {/* Big score */}
                  <div className="flex flex-col items-center justify-center sm:w-32 shrink-0">
                    <span className="text-5xl font-black text-gray-900">{avgRating!.toFixed(1)}</span>
                    <div className="flex mt-1.5">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={cn("w-4 h-4", s <= Math.round(avgRating!) ? "fill-yellow-400 text-yellow-400" : "text-gray-200 fill-gray-200")} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">{product.reviews.length} review{product.reviews.length !== 1 ? "s" : ""}</p>
                  </div>

                  {/* Bar chart */}
                  <div className="flex-1 space-y-2 justify-center flex flex-col">
                    {starCounts.map(({ star, pct }) => (
                      <div key={star} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-8 shrink-0 text-right">{star} ★</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-8 shrink-0">{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Review list ── */}
                <div className="space-y-5">
                  {product.reviews.map((review) => (
                    <div key={review.id} className="flex gap-3 pb-5 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm shrink-0 overflow-hidden">
                        {review.reviewer.image
                          ? <Image src={review.reviewer.image} alt={review.reviewer.name ?? ""} width={36} height={36} className="rounded-full object-cover" />
                          : (review.reviewer.name?.[0] ?? "U").toUpperCase()
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-gray-800">{review.reviewer.name ?? "User"}</p>
                          {verifiedBuyerIds.has(review.reviewerId) && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100">
                              <BadgeCheck className="w-3 h-3" /> Verified Purchase
                            </span>
                          )}
                          <span className="text-xs text-gray-400 ml-auto">
                            {new Date(review.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {[1,2,3,4,5].map((s) => (
                            <Star key={s} className={cn("w-3.5 h-3.5", s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200 fill-gray-200")} />
                          ))}
                          <span className="text-xs font-semibold text-gray-500 ml-1">{review.rating}.0</span>
                        </div>
                        {review.comment && <p className="text-sm text-gray-700 mt-2 leading-relaxed">{review.comment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="font-semibold text-gray-500">No reviews yet</p>
                <p className="text-sm mt-1">Be the first to review this product</p>
              </div>
            )}
          </div>

          {/* ── Write a Review ── */}
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900">Review this product</h2>
            <p className="text-sm text-gray-500 mt-1 mb-5">Share your thoughts with other customers</p>

            {!session?.user ? (
              <Link
                href={`/login?callbackUrl=/products/${product.id}`}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50 transition-all"
              >
                Sign in to write a review
              </Link>
            ) : myEligibleOrder ? (
              <WriteReviewForm
                productId={product.id}
                orderId={myEligibleOrder.id}
                existing={myExistingReview}
              />
            ) : (
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-4 border border-gray-100">
                <Package className="w-5 h-5 text-gray-300 shrink-0" />
                <p className="text-sm text-gray-500">
                  Only buyers who have received this product can leave a review.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { title: true, description: true, images: true, category: true } });
  if (!product) return { title: "Product Not Found" };
  const site = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.example.com";
  const url = `${site}/products/${id}`;
  return {
    title: `${product.title} — Exhubb`,
    description: product.description ?? undefined,
    openGraph: {
      title: `${product.title} — Exhubb`,
      description: product.description ?? undefined,
      images: product.images && product.images.length ? product.images : undefined,
      type: "website",
    },
    alternates: {
      canonical: url,
    },
  };
}
