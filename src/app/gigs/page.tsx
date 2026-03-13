import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import {
  Search, Star, Briefcase, Clock, Tag, Zap, Crown,
} from "lucide-react";
import GigSampleSlideshow from "./GigSampleSlideshow";
import { cn } from "@/lib/utils";
import GigsSortSelect from "./GigsSortSelect";

export const metadata: Metadata = {
  title: "Hire Freelancers — Exhubb",
  description: "Find skilled freelancers for design, tech, marketing, writing and more.",
};

const CATEGORIES = [
  "All",
  "Design & Creative",
  "Tech & Dev",
  "Marketing",
  "Writing & Translation",
  "Music & Audio",
  "Video & Animation",
  "Data & Analytics",
  "Business",
  "Photography",
  "Legal",
  "Finance",
  "Other",
];

interface Props {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}

export default async function GigsPage({ searchParams }: Props) {
  const params   = await searchParams;
  const q        = params.q        ?? "";
  const category = params.category ?? "";
  const sort     = params.sort     ?? "newest";
  const sellerId = params.sellerId ?? undefined;

  const gigs = await prisma.gig.findMany({
    where: {
      isActive: true,
      ...(sellerId && { freelancerId: sellerId }),
      ...(category && category !== "All" && { category }),
      ...(q && {
        OR: [
          { title:       { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { tags:        { has: q } },
        ],
      }),
    },
    include: {
      freelancer: { select: { id: true, name: true, image: true, location: true, isSellerVerified: true } },
      _count:     { select: { orders: true } },
      // include samples for the slideshow preview

    },
    orderBy:
      sort === "price_asc"  ? { basicPrice: "asc" }  :
      sort === "price_desc" ? { basicPrice: "desc" }  :
      sort === "popular"    ? { orders: { _count: "desc" } } :
      { createdAt: "desc" },
  });

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">

        {/* ── Hero ────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-[#061a0e] via-primary-900 to-[#0a2a15] py-12 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-primary-400 text-sm font-semibold mb-2">Freelance Services</p>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Find the perfect freelancer
            </h1>
            <p className="text-gray-400 mb-6 text-sm">
              Hire skilled professionals for design, tech, marketing, and more.
            </p>
            {/* Search bar */}
            <form className="flex gap-2 max-w-xl mx-auto">
              <div className="flex-1 flex items-center gap-2 h-12 px-4 rounded-xl bg-white shadow-sm">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Search services…"
                  className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400"
                />
                {category && <input type="hidden" name="category" value={category} />}
                {sort && sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
              </div>
              <button
                type="submit"
                className="h-12 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* ── Category pills ─────────────────────────────────── */}
          <div className="flex gap-2 flex-wrap mb-6">
            {CATEGORIES.map((cat) => {
              const active = cat === "All" ? !category || category === "All" : category === cat;
              const href   = cat === "All"
                ? `/gigs${q ? `?q=${q}` : ""}`
                : `/gigs?category=${encodeURIComponent(cat)}${q ? `&q=${q}` : ""}`;
              return (
                <Link
                  key={cat}
                  href={href}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                    active
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-primary-400 hover:text-primary-700",
                  )}
                >
                  {cat}
                </Link>
              );
            })}
          </div>

          {/* ── Toolbar ─────────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-gray-500">
              <span className="font-bold text-gray-900">{gigs.length}</span> service{gigs.length !== 1 ? "s" : ""} found
            </p>
            <GigsSortSelect q={q} category={category} sort={sort} />
          </div>

          {/* ── Gig Grid ────────────────────────────────────────── */}
          {gigs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-gray-100">
              <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5">
                <Briefcase className="w-9 h-9 text-indigo-200" />
              </div>
              <p className="text-lg font-bold text-gray-700 mb-1">No services found</p>
              <p className="text-sm text-gray-400 mb-5 max-w-xs">
                {q ? `No results for "${q}".` : "No active gigs in this category yet."}
              </p>
              {(q || category) && (
                <Link
                  href="/gigs"
                  className="text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Clear filters
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {gigs.map((gig) => (
                <Link
                  key={gig.id}
                  href={`/gigs/${gig.id}`}
                  className="group bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col"
                >
                  {/* Samples slideshow */}
                  <GigSampleSlideshow
                    samples={gig.samples}
                    title={gig.title}
                    className="h-36 flex-shrink-0"
                  />

                  <div className="p-4 flex flex-col flex-1 gap-3">
                    {/* Seller */}
                    <div className="flex items-center gap-2">
                      {gig.freelancer.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={gig.freelancer.image}
                          alt={gig.freelancer.name ?? ""}
                          className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] text-white font-black">
                            {(gig.freelancer.name ?? "?")[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="text-xs font-semibold text-gray-600 truncate">
                        {gig.freelancer.name ?? "Freelancer"}
                      </span>
                    </div>

                    {/* Title */}
                    <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug flex-1">
                      {gig.title}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {gig.deliveryDays}d
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {gig.category.split(" & ")[0]}
                      </span>
                      {gig._count.orders > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          {gig._count.orders} order{gig._count.orders !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {/* Price tiers */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-gray-50">
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary-50">
                        <Zap className="w-3 h-3 text-primary-600" />
                        <span className="text-xs font-black text-primary-700">${gig.basicPrice.toFixed(0)}</span>
                      </div>
                      {gig.standardPrice && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50">
                          <Star className="w-3 h-3 text-amber-500" />
                          <span className="text-xs font-black text-amber-700">${gig.standardPrice.toFixed(0)}</span>
                        </div>
                      )}
                      {gig.premiumPrice && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-50">
                          <Crown className="w-3 h-3 text-purple-500" />
                          <span className="text-xs font-black text-purple-700">${gig.premiumPrice.toFixed(0)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
