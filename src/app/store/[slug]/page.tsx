import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import { Store, Star, Package, MapPin, BadgeCheck, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seller = await prisma.user.findUnique({
    where: { storeSlug: slug },
    select: { storeName: true, storeBio: true },
  });
  if (!seller) return { title: "Store Not Found" };
  return {
    title: `${seller.storeName ?? slug} — Exhubb`,
    description: seller.storeBio ?? undefined,
  };
}

export default async function PublicStorePage({ params }: Props) {
  const { slug } = await params;

  const seller = await prisma.user.findUnique({
    where: { storeSlug: slug },
    select: {
      id: true,
      storeName: true,
      storeSlug: true,
      storeBio: true,
      storeLogo: true,
      storeBanner: true,
      isSellerVerified: true,
      sellerStatus: true,
      location: true,
      createdAt: true,
    },
  });

  if (!seller || seller.sellerStatus === "SUSPENDED") notFound();

  // Fetch active products + stats
  const [products, completedOrderCount, avgRatingData] = await Promise.all([
    prisma.product.findMany({
      where: { sellerId: seller.id, isActive: true },
      orderBy: { createdAt: "desc" },
      include: { reviews: { select: { rating: true } } },
    }),
    prisma.order.count({ where: { sellerId: seller.id, status: "COMPLETED" } }),
    prisma.review.aggregate({
      where: { product: { sellerId: seller.id } },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  const avgRating  = avgRatingData._avg.rating ?? 0;
  const totalReviews = avgRatingData._count.rating;
  const memberSince  = new Date(seller.createdAt).getFullYear();

  function productAvgRating(reviews: { rating: number }[]) {
    if (!reviews.length) return null;
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">

        {/* Banner */}
        <div className="relative w-full h-48 sm:h-64 bg-gradient-to-br from-primary-600 to-primary-800 overflow-hidden">
          {seller.storeBanner && (
            /\.(mp4|webm|mov)$/i.test(seller.storeBanner)
              ? <video
                  src={seller.storeBanner}
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay muted loop playsInline
                />
              : <Image
                  src={seller.storeBanner}
                  alt="Store banner"
                  fill
                  className="object-cover"
                  unoptimized={seller.storeBanner.startsWith("/uploads/")}
                />
          )}
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Store header */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-12 mb-6 flex items-end gap-4">
            {/* Logo */}
            <div className="w-24 h-24 rounded-2xl border-4 border-white bg-white overflow-hidden shadow-lg flex-shrink-0">
              {seller.storeLogo
                ? <Image src={seller.storeLogo} alt="Store logo" width={96} height={96} className="object-cover w-full h-full" unoptimized={seller.storeLogo.startsWith("/uploads/")} />
                : <div className="w-full h-full flex items-center justify-center bg-primary-50">
                    <Store className="w-10 h-10 text-primary-400" />
                  </div>
              }
            </div>
            {/* Name + badges */}
            <div className="pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-gray-900 drop-shadow-sm">
                  {seller.storeName ?? slug}
                </h1>
                {seller.isSellerVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                    <BadgeCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </div>
              {seller.location && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" /> {seller.location}
                </p>
              )}
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap gap-6 mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-2 text-sm">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="font-semibold text-gray-900">{products.length}</span>
              <span className="text-gray-500">Listings</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ShoppingBag className="w-4 h-4 text-gray-400" />
              <span className="font-semibold text-gray-900">{completedOrderCount}</span>
              <span className="text-gray-500">Sales</span>
            </div>
            {totalReviews > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold text-gray-900">{avgRating.toFixed(1)}</span>
                <span className="text-gray-500">({totalReviews} reviews)</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              Member since {memberSince}
            </div>
          </div>

          {/* Bio */}
          {seller.storeBio && (
            <p className="text-sm text-gray-600 max-w-2xl mb-8 leading-relaxed">
              {seller.storeBio}
            </p>
          )}

          {/* Products grid */}
          <div className="mb-12">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              All Listings <span className="text-gray-400 font-normal text-sm">({products.length})</span>
            </h2>

            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-100">
                <Package className="w-12 h-12 text-gray-200 mb-3" />
                <p className="text-gray-500 font-semibold">No listings yet</p>
                <p className="text-sm text-gray-400 mt-1">This store hasn&apos;t listed any products yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {products.map((product) => {
                  const rating = productAvgRating(product.reviews);
                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
                    >
                      {/* Image */}
                      <div className="aspect-square bg-gray-50 overflow-hidden">
                        {product.images[0]
                          ? <Image
                              src={product.images[0]}
                              alt={product.title}
                              width={300}
                              height={300}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          : <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-10 h-10 text-gray-200" />
                            </div>
                        }
                      </div>
                      {/* Info */}
                      <div className="p-3">
                        <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">
                          {product.title}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div>
                            <p className="text-sm font-black text-gray-900">
                              ₦{product.price.toLocaleString()}
                            </p>
                            {product.compareAtPrice && product.compareAtPrice > product.price && (
                              <p className="text-xs text-gray-400 line-through">
                                ₦{product.compareAtPrice.toLocaleString()}
                              </p>
                            )}
                          </div>
                          {rating && (
                            <div className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              <span className="text-xs text-gray-500">{rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>

                        {/* Shipping zones */}
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {product.shippingZones.includes("NIGERIA") && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded-full font-medium">🇳🇬 NG</span>
                          )}
                          {product.shippingZones.includes("AFRICA") && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">🌍 AF</span>
                          )}
                          {product.shippingZones.includes("INTERNATIONAL") && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded-full font-medium">🌐 INT</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
