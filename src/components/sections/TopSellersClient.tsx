"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Star, ShieldCheck, ArrowRight, type LucideIcon } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

const ICON_PLACEHOLDER = null as unknown as LucideIcon;

const LEVEL_COLORS: Record<string, string> = {
  "Top Rated": "bg-primary-900/60 text-primary-300 border-primary-700/40",
  PRO: "bg-gold-900/60 text-gold-300 border-gold-600/40",
  "Level 2": "bg-sky-900/60 text-sky-300 border-sky-700/40",
};

type SellerItem = {
  id: string;
  name: string;
  specialty?: string;
  country?: string;
  storeSlug?: string | null;
  rating?: number | null;
  reviews?: number | null;
  sales?: string | number | null;
  verified?: boolean;
  level?: string;
  avatar?: string | null;
  gradient?: string;
  listing?: string;
  listingTitle?: string;
  listingPrice?: string;
};

export default function TopSellersClient({ sellers }: { sellers: SellerItem[] }) {
  const autoplay = useMemo(() => Autoplay({ stopOnInteraction: false, delay: 2800 }), []);
  const [emblaRef] = useEmblaCarousel({ loop: true, align: "start", dragFree: true }, [autoplay]);

  return (
    <section className="section-padding bg-[#060f0a] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />

      <div className="container-wide relative z-10">
        {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="section-chip bg-primary-950/60 text-primary-400 border border-primary-800/40 mb-3">Community Stars</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="heading-lg text-white">Top Sellers This Month</motion.h2>
          </div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <Link href="/gigs" className="arrow-link text-primary-400 hover:text-primary-300 text-sm font-semibold whitespace-nowrap">Browse All Sellers <ArrowRight className="w-4 h-4 ml-1 inline" /></Link>
          </motion.div>
        </div>

        {/* Carousel */}
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-5">
            {sellers.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} whileHover={{ y: -6 }} className="flex-shrink-0 w-[85%] sm:w-[260px] rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm p-5 group cursor-default">
                <div className="relative mb-4">
                  <div className={`w-16 h-16 rounded-full ${s.gradient ?? "bg-gradient-to-br from-primary-700 to-primary-500"} flex items-center justify-center text-white text-lg font-bold ring-2 ring-offset-2 ring-offset-gray-900 ring-white/10 overflow-hidden` }>
                    {s.avatar && (typeof s.avatar === "string") && (s.avatar.startsWith("http") || s.avatar.startsWith("/") || s.avatar.includes(".jpg") || s.avatar.includes(".png") || s.avatar.includes("/uploads/")) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.avatar} alt={s.name} className="w-full h-full object-cover" />
                    ) : (
                      (s.avatar ?? (s.name ? s.name.split(" ").map((n) => n[0]).slice(0, 2).join("") : "U"))
                    )}
                  </div>
                  {s.verified && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center"><ShieldCheck className="w-3 h-3 text-white" /></div>
                  )}
                  <span className={`absolute top-0 right-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${LEVEL_COLORS[s.level ?? "PRO"]}`}>{s.level}</span>
                </div>

                <p className="text-white font-bold text-sm leading-tight">{s.name}</p>
                <p className="text-gray-500 text-xs mb-0.5">{s.specialty}</p>
                <p className="text-gray-600 text-xs mb-3">{s.country}</p>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-0.5">{Array.from({ length: 5 }).map((_, j) => (<Star key={j} className="w-3 h-3 fill-gold-400 text-gold-400" />))}</div>
                  <span className="text-gold-400 text-xs font-semibold">{(s.rating ?? 0).toFixed(1)}</span>
                  <span className="text-gray-600 text-xs">({(s.reviews ?? 0).toLocaleString()})</span>
                </div>

                <div className="bg-white/[0.05] rounded-xl p-3 mb-4 border border-white/[0.05]">
                  <div className="text-primary-400/60 mb-1">
                    {/* placeholder icon */}
                  </div>
                  <p className="text-white text-xs font-medium leading-snug">{s.listingTitle}</p>
                  <p className="text-primary-400 text-xs font-bold mt-0.5">From {s.listingPrice}</p>
                </div>

                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    {/* Link to public freelancer profile page with defensive fallback and runtime logging */}
                    {(() => {
                      const profileHref = s.id ? `/freelancer/${s.id}` : s.storeSlug ? `/store/${s.storeSlug}` : `/gigs`;
                      return (
                        <Link
                          href={profileHref}
                          data-href={profileHref}
                          onClick={() => {
                            // Small client-side runtime log to help debug incorrect navigation
                            // eslint-disable-next-line no-console
                            console.debug("TopSellers: navigating to", profileHref, s);
                          }}
                          className="w-full block text-center py-2 text-xs font-semibold text-white border border-white/10 rounded-lg hover:border-primary-600/50 hover:bg-primary-950/40 transition-all"
                        >
                          View Profile <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
                        </Link>
                      );
                    })()}
                  </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
