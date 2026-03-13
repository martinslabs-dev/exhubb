import TopSellersClient from "./TopSellersClient";
import { prisma } from "@/lib/db";

export default async function TopSellers() {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const orders = await prisma.order.findMany({
    where: { gigId: { not: null }, createdAt: { gte: since } },
    include: {
      seller: { select: { id: true, name: true, image: true, location: true, isSellerVerified: true, storeSlug: true } },
      gig: { select: { id: true, title: true, basicPrice: true } },
    },
  });

  const map = new Map<string, { seller: any; count: number; listingTitle?: string; listingPrice?: number }>();
  for (const o of orders) {
    const s = o.seller;
    const entry = map.get(s.id) ?? { seller: s, count: 0, listingTitle: o.gig?.title, listingPrice: o.gig?.basicPrice };
    entry.count += 1;
    map.set(s.id, entry);
  }

  const top = Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 6);

  const sellers = top.map((e) => {
    const sales = e.count;
    const level = e.seller.isSellerVerified ? "Top Rated" : sales >= 10 ? "PRO" : "Level 2";
    const listingPrice = e.listingPrice ? `₦${Math.round(e.listingPrice).toLocaleString("en-NG")}` : "₦0";
    return {
      id: e.seller.id,
      name: e.seller.name ?? "Unknown",
      specialty: e.listingTitle ?? "Service",
      country: e.seller.location ?? "",
      rating: 0,
      reviews: e.count,
      sales: sales >= 1000 ? `${(sales / 1000).toFixed(1)}k` : `${sales}`,
      verified: e.seller.isSellerVerified ?? false,
      level,
      avatar: e.seller.image ?? (e.seller.name ? e.seller.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("") : "U"),
      gradient: "from-primary-700 to-primary-500",
      listing: "Code2",
      listingTitle: e.listingTitle ?? "",
      listingPrice,
      storeSlug: e.seller.storeSlug ?? null,
    };
  });

  if (sellers.length === 0) {
    // Fallback: no orders in last 30 days — show active gigs instead
    const gigs = await prisma.gig.findMany({
      where: { isActive: true },
      include: { freelancer: { select: { id: true, name: true, image: true, location: true, isSellerVerified: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    const fallback = gigs.map((g) => ({
      id: g.freelancer.id,
      name: g.freelancer.name ?? "Unknown",
      specialty: g.title ?? "Service",
      country: g.freelancer.location ?? "",
      rating: 0,
      reviews: 0,
      sales: 0,
      verified: g.freelancer.isSellerVerified ?? false,
      level: g.freelancer.isSellerVerified ? "Top Rated" : "PRO",
      avatar: g.freelancer.image ?? (g.freelancer.name ? g.freelancer.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("") : "U"),
      gradient: "from-primary-700 to-primary-500",
      listing: "Service",
      listingTitle: g.title ?? "",
      listingPrice: g.basicPrice ? `₦${Math.round(g.basicPrice).toLocaleString("en-NG")}` : "₦0",
    }));

    return <TopSellersClient sellers={fallback} />;
  }

  return <TopSellersClient sellers={sellers} />;
}
