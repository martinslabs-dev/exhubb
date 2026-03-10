import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Star, Package, BadgeCheck, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "Reviews" };

export default async function SellerReviewsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const roleCheck = await prisma.user.findUnique({ where: { id: userId }, select: { isSeller: true } });
  if (!roleCheck?.isSeller) redirect("/dashboard/buyer");

  const [reviews, completedOrders] = await Promise.all([
    prisma.review.findMany({
      where:   { product: { sellerId: userId } },
      include: {
        product:  { select: { id: true, title: true, images: true } },
        reviewer: { select: { name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where:  { sellerId: userId, status: { in: ["DELIVERED", "COMPLETED"] } },
      select: { buyerId: true, productId: true },
    }),
  ]);

  // Build a set of "productId:buyerId" for verified badge
  const verifiedSet = new Set(completedOrders.map((o) => `${o.productId}:${o.buyerId}`));

  const totalReviews = reviews.length;
  const avgRating    = totalReviews > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / totalReviews
    : 0;
  const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => { breakdown[r.rating] = (breakdown[r.rating] ?? 0) + 1; });

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Customer Reviews</h1>
        <p className="text-sm text-gray-500 mt-1">Reviews left by buyers on your products</p>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        {totalReviews === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Star className="w-10 h-10 text-gray-200 mb-3" />
            <p className="font-semibold text-gray-500">No reviews yet</p>
            <p className="text-sm text-gray-400 mt-1">Reviews will appear here once buyers rate your products.</p>
            <Link href="/dashboard/seller/listings" className="mt-4 text-sm text-primary-600 hover:underline font-semibold">
              View your listings →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
            {/* Big avg */}
            <div className="text-center shrink-0">
              <p className="text-6xl font-black text-gray-900">{avgRating.toFixed(1)}</p>
              <div className="flex items-center justify-center gap-0.5 mt-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      "w-5 h-5",
                      s <= Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
                    )}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">{totalReviews} review{totalReviews !== 1 ? "s" : ""}</p>
            </div>

            {/* Breakdown bars */}
            <div className="flex-1 w-full space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = breakdown[star] ?? 0;
                const pct   = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-10 shrink-0">
                      <span className="text-xs text-gray-500 font-semibold">{star}</span>
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-16 shrink-0">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Review list */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((review) => {
            const isVerified = verifiedSet.has(`${review.productId}:${review.reviewerId}`);
            const img = review.product.images[0];
            return (
              <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                {/* Product row */}
                <Link
                  href={`/products/${review.product.id}`}
                  className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {img
                      ? <Image src={img} alt={review.product.title} width={48} height={48} className="w-full h-full object-cover" />
                      : <Package className="w-5 h-5 text-gray-300" />
                    }
                  </div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-primary-700 transition-colors line-clamp-1">
                    {review.product.title}
                  </p>
                </Link>

                {/* Reviewer + rating */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm shrink-0 overflow-hidden">
                    {review.reviewer.image
                      ? <Image src={review.reviewer.image} alt={review.reviewer.name ?? ""} width={36} height={36} className="rounded-full object-cover" />
                      : (review.reviewer.name?.[0] ?? "U").toUpperCase()
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-800">{review.reviewer.name ?? "User"}</p>
                      {isVerified && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100">
                          <BadgeCheck className="w-3 h-3" /> Verified Purchase
                        </span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(review.createdAt).toLocaleDateString("en-NG", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            "w-4 h-4",
                            s <= review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
                          )}
                        />
                      ))}
                      <span className="text-xs font-semibold text-gray-500 ml-1">{review.rating}.0</span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-700 mt-2 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                </div>

                {/* Reply CTA */}
                <div className="mt-4 pt-3 border-t border-gray-50 flex justify-end">
                  <Link
                    href={`/dashboard/buyer/messages`}
                    className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-semibold"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Message buyer
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
