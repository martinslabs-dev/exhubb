import TodaysDealsClient from "./TodaysDealsClient";
import { prisma } from "@/lib/db";

export default async function TodaysDeals() {
  // Fetch recent products that have a compareAtPrice (on sale)
  const products = await prisma.product.findMany({
    where: { isActive: true, compareAtPrice: { not: null } },
    include: { seller: { select: { id: true, name: true, sellerStatus: true } } },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });

  const deals = products.map((p) => {
    const original = p.compareAtPrice ?? null;
    const current = p.price;
    const pct = original ? Math.round((1 - current / original) * 100) : 0;
    return {
      id: p.id,
      icon: "Smartphone",
      imageUrl: (p.images && p.images.length > 0) ? p.images[0] : null,
      category: p.category ?? "Other",
      title: p.title,
      original,
      current,
      rating: null,
      reviews: null,
      seller: p.seller?.name ?? null,
      verified: false,
      freeShipping: (p.shippingZones && p.shippingZones.length > 0) || false,
      badge: pct > 0 ? `${pct}% OFF` : null,
      hot: false,
    };
  });

  // derive filters from the deals' categories (unique, preserve order)
  const seen = new Set<string>();
  const filters: string[] = [];
  for (const d of deals) {
    const c = d.category ?? "Other";
    if (!seen.has(c)) {
      seen.add(c);
      filters.push(c);
    }
  }

  return <TodaysDealsClient deals={deals} filters={filters} />;
}
