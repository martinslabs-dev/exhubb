import FeaturedServicesClient from "./FeaturedServicesClient";
import { prisma } from "@/lib/db";

type Service = {
  id: string;
  icon?: string;
  category?: string | null;
  title: string;
  sellerName?: string | null;
  sellerCountry?: string | null;
  level?: string | null;
  rating?: number | null;
  reviews?: number | null;
  price: number;
  tags: string[];
  coverImage?: string | null;
  sellerAvatar?: string | null;
  deliveryDays?: number | null;
};

export default async function FeaturedServices() {
  const gigs = await prisma.gig.findMany({
    where: { isActive: true },
    include: {
      freelancer: { select: { id: true, name: true, image: true, location: true, isFreelancer: true, isSellerVerified: true } },
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const services: Service[] = gigs.map((g) => {
    const ordersCount = (g as any)._count?.orders ?? 0;
    let level: string | null = null;
    if (g.freelancer?.isSellerVerified) level = "Top Rated";
    else if (ordersCount >= 10) level = "PRO";

    return {
      id: g.id,
      title: g.title,
      category: g.category,
      price: Math.round(g.basicPrice ?? 0),
      tags: g.tags ?? [],
      coverImage: g.coverImage ?? null,
      sellerAvatar: g.freelancer?.image ?? null,
      sellerName: g.freelancer?.name ?? null,
      sellerCountry: g.freelancer?.location ?? null,
      deliveryDays: g.deliveryDays ?? 3,
      level,
      rating: null,
      reviews: ordersCount,
    };
  });

  return <FeaturedServicesClient services={services} />;
}
