import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import GigSampleSlideshow from "@/app/gigs/GigSampleSlideshow";
import {
  Clock,
  Tag,
  Zap,
  Star,
  Crown,
  ShoppingBag,
  MessageSquare,
  CheckCircle2,
  MapPin,
  BadgeCheck,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const gig = await prisma.gig.findUnique({ where: { id }, select: { title: true } });
  return { title: gig ? `${gig.title} — Exhubb` : "Gig Not Found" };
}

export default async function GigDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  const gig = await prisma.gig.findUnique({
    where: { id, isActive: true },
    include: {
      freelancer: {
        select: {
          id: true,
          name: true,
          image: true,
          bio: true,
          location: true,
          isSellerVerified: true,
          createdAt: true,
        },
      },
      _count: { select: { orders: true } },
    },
  });

  if (!gig) notFound();

  const isSelf = session?.user?.id === gig.freelancerId;

  const tiers = [
    {
      key: "basic",
      label: "Basic",
      price: gig.basicPrice,
      icon: <Zap className="w-4 h-4 text-primary-600" />,
      bg: "bg-primary-50",
      border: "border-primary-200",
      btnClass: "bg-primary-600 hover:bg-primary-700",
      textClass: "text-primary-700",
    },
    ...(gig.standardPrice
      ? [{
          key: "standard",
          label: "Standard",
          price: gig.standardPrice,
          icon: <Star className="w-4 h-4 text-amber-500" />,
          bg: "bg-amber-50",
          border: "border-amber-200",
          btnClass: "bg-amber-500 hover:bg-amber-600",
          textClass: "text-amber-700",
        }]
      : []),
    ...(gig.premiumPrice
      ? [{
          key: "premium",
          label: "Premium",
          price: gig.premiumPrice,
          icon: <Crown className="w-4 h-4 text-purple-600" />,
          bg: "bg-purple-50",
          border: "border-purple-200",
          btnClass: "bg-purple-600 hover:bg-purple-700",
          textClass: "text-purple-700",
        }]
      : []),
  ];

  const memberSince = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    new Date(gig.freelancer.createdAt),
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Breadcrumb */}
          <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
            <Link href="/gigs" className="hover:text-primary-600 transition-colors">Services</Link>
            <span>/</span>
            <span className="text-gray-500">{gig.category}</span>
            <span>/</span>
            <span className="text-gray-700 font-semibold truncate max-w-xs">{gig.title}</span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-8">

            {/* ── Left: main content ────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-6">

              {/* Title */}
              <div>
                <h1 className="text-2xl font-black text-gray-900 leading-snug mb-3">
                  {gig.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> {gig.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {gig.deliveryDays} day{gig.deliveryDays !== 1 ? "s" : ""} delivery
                  </span>
                  {gig._count.orders > 0 && (
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5" /> {gig._count.orders} orders
                    </span>
                  )}
                </div>
              </div>

              {/* Samples gallery */}
              <GigSampleSlideshow
                samples={gig.samples}
                title={gig.title}
                className="h-64 sm:h-80 rounded-2xl overflow-hidden"
              />

              {/* Freelancer card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4">
                {gig.freelancer.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={gig.freelancer.image}
                    alt={gig.freelancer.name ?? ""}
                    className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl text-white font-black">
                      {(gig.freelancer.name ?? "?")[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-gray-900">
                      {gig.freelancer.name ?? "Freelancer"}
                    </p>
                    {gig.freelancer.isSellerVerified && (
                      <BadgeCheck className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    )}
                  </div>
                  {gig.freelancer.location && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {gig.freelancer.location}
                    </p>
                  )}
                  {gig.freelancer.bio && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{gig.freelancer.bio}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">Member since {memberSince}</p>
                </div>
              </div>

              {/* Description */}
              {gig.description && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-3">About this service</h2>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{gig.description}</p>
                </div>
              )}

              {/* Tags */}
              {gig.tags.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-3">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {gig.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/gigs?q=${encodeURIComponent(tag)}`}
                        className="px-3 py-1 rounded-full bg-gray-100 hover:bg-primary-50 text-xs font-semibold text-gray-600 hover:text-primary-700 transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right: pricing sidebar ────────────────────────── */}
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="sticky top-24 space-y-3">

                {tiers.map((tier) => (
                  <div
                    key={tier.key}
                    className={`rounded-2xl border ${tier.border} ${tier.bg} p-5`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center">
                          {tier.icon}
                        </div>
                        <span className={`text-sm font-black ${tier.textClass}`}>{tier.label}</span>
                      </div>
                      <span className={`text-xl font-black ${tier.textClass}`}>${tier.price.toFixed(0)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
                      <Clock className="w-3 h-3" />
                      <span>{gig.deliveryDays} day{gig.deliveryDays !== 1 ? "s" : ""} delivery</span>
                      <CheckCircle2 className="w-3 h-3 ml-2 text-green-500" />
                      <span>Revisions included</span>
                    </div>

                    {isSelf ? (
                      <div className={`w-full py-2.5 rounded-xl text-center text-xs font-bold text-white ${tier.btnClass} opacity-50 cursor-not-allowed`}>
                        Your own gig
                      </div>
                    ) : session ? (
                      <Link
                        href={`/dashboard/buyer/messages`}
                        className={`block w-full py-2.5 rounded-xl text-center text-sm font-bold text-white ${tier.btnClass} transition-colors`}
                      >
                        Order {tier.label} — ${tier.price.toFixed(0)}
                      </Link>
                    ) : (
                      <Link
                        href={`/login?redirect=/gigs/${gig.id}`}
                        className={`block w-full py-2.5 rounded-xl text-center text-sm font-bold text-white ${tier.btnClass} transition-colors`}
                      >
                        Sign in to Order
                      </Link>
                    )}
                  </div>
                ))}

                {/* Message button */}
                {!isSelf && (
                  <Link
                    href={session ? `/dashboard/buyer/messages` : `/login?redirect=/gigs/${gig.id}`}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/40 text-sm font-bold text-gray-700 hover:text-primary-700 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Message Freelancer
                  </Link>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
