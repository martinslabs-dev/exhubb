"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Star, ShieldCheck, ArrowRight, Gem, Code2, Mic, Palette, Smartphone, PenLine, type LucideIcon } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

const LISTING_ICON_MAP: Record<string, LucideIcon> = {
  Gem, Code2, Mic, Palette, Smartphone, PenLine,
};

const SELLERS = [
  {
    id: 1,
    name: "Amara Diallo",
    specialty: "Handmade Jewelry",
    country: "🇸🇳 Senegal",
    rating: 5.0,
    reviews: 1240,
    sales: "3.2k",
    verified: true,
    level: "Top Rated",
    avatar: "AD",
    gradient: "from-gold-600 to-gold-400",
    listing: "Gem",
    listingTitle: "Beaded Necklace Set",
    listingPrice: "$48",
  },
  {
    id: 2,
    name: "Marcus Osei",
    specialty: "Web Development",
    country: "🇬🇭 Ghana",
    rating: 4.9,
    reviews: 892,
    sales: "2.8k",
    verified: true,
    level: "PRO",
    avatar: "MO",
    gradient: "from-primary-700 to-primary-500",
    listing: "Code2",
    listingTitle: "Full-Stack Web App",
    listingPrice: "$340",
  },
  {
    id: 3,
    name: "Yuki Tanaka",
    specialty: "Voice Acting",
    country: "🇯🇵 Japan",
    rating: 5.0,
    reviews: 2100,
    sales: "5.1k",
    verified: true,
    level: "Top Rated",
    avatar: "YT",
    gradient: "from-purple-700 to-purple-500",
    listing: "Mic",
    listingTitle: "English Voiceover 60s",
    listingPrice: "$55",
  },
  {
    id: 4,
    name: "Ingrid Svensson",
    specialty: "UI/UX Design",
    country: "🇸🇪 Sweden",
    rating: 4.9,
    reviews: 671,
    sales: "1.9k",
    verified: true,
    level: "Level 2",
    avatar: "IS",
    gradient: "from-sky-700 to-sky-500",
    listing: "Palette",
    listingTitle: "App UI Kit – Figma",
    listingPrice: "$120",
  },
  {
    id: 5,
    name: "Roberto Lima",
    specialty: "Mobile Development",
    country: "🇧🇷 Brazil",
    rating: 5.0,
    reviews: 540,
    sales: "1.4k",
    verified: true,
    level: "PRO",
    avatar: "RL",
    gradient: "from-rose-700 to-rose-500",
    listing: "Smartphone",
    listingTitle: "React Native App",
    listingPrice: "$580",
  },
  {
    id: 6,
    name: "Fatima Al-Hassan",
    specialty: "Content Writing",
    country: "🇦🇪 UAE",
    rating: 4.8,
    reviews: 1580,
    sales: "4.2k",
    verified: true,
    level: "Top Rated",
    avatar: "FA",
    gradient: "from-orange-600 to-orange-400",
    listing: "PenLine",
    listingTitle: "SEO Blog Articles",
    listingPrice: "$65",
  },
];

const LEVEL_COLORS: Record<string, string> = {
  "Top Rated": "bg-primary-900/60 text-primary-300 border-primary-700/40",
  "PRO": "bg-gold-900/60 text-gold-300 border-gold-600/40",
  "Level 2": "bg-sky-900/60 text-sky-300 border-sky-700/40",
};

export default function TopSellers() {
  const autoplay = useMemo(() => Autoplay({ stopOnInteraction: false, delay: 2800 }), []);
  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: "start", dragFree: true },
    [autoplay]
  );

  return (
    <section className="section-padding bg-[#060f0a] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />

      <div className="container-wide relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="section-chip bg-primary-950/60 text-primary-400 border border-primary-800/40 mb-3"
            >
              Community Stars
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="heading-lg text-white"
            >
              Top Sellers This Month
            </motion.h2>
          </div>
          <motion.a
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            href="#"
            className="arrow-link text-primary-400 hover:text-primary-300 text-sm font-semibold whitespace-nowrap"
          >
            Browse All Sellers <ArrowRight className="w-4 h-4 ml-1 inline" />
          </motion.a>
        </div>

        {/* Carousel */}
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-5">
            {SELLERS.map((s, i) => {
              const ListingIcon = LISTING_ICON_MAP[s.listing];
              return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -6 }}
                className="flex-shrink-0 w-[260px] rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm p-5 group cursor-default"
              >
                {/* Avatar */}
                <div className="relative mb-4">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white text-lg font-bold ring-2 ring-offset-2 ring-offset-gray-900 ring-white/10`}>
                    {s.avatar}
                  </div>
                  {s.verified && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                      <ShieldCheck className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <span className={`absolute top-0 right-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${LEVEL_COLORS[s.level]}`}>
                    {s.level}
                  </span>
                </div>

                {/* Info */}
                <p className="text-white font-bold text-sm leading-tight">{s.name}</p>
                <p className="text-gray-500 text-xs mb-0.5">{s.specialty}</p>
                <p className="text-gray-600 text-xs mb-3">{s.country}</p>

                {/* Rating row */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star
                        key={j}
                        className="w-3 h-3 fill-gold-400 text-gold-400"
                      />
                    ))}
                  </div>
                  <span className="text-gold-400 text-xs font-semibold">{s.rating}</span>
                  <span className="text-gray-600 text-xs">({s.reviews.toLocaleString()})</span>
                </div>

                {/* Top listing */}
                <div className="bg-white/[0.05] rounded-xl p-3 mb-4 border border-white/[0.05]">
                  <div className="text-primary-400/60 mb-1">
                    <ListingIcon className="w-6 h-6" />
                  </div>
                  <p className="text-white text-xs font-medium leading-snug">{s.listingTitle}</p>
                  <p className="text-primary-400 text-xs font-bold mt-0.5">From {s.listingPrice}</p>
                </div>

                {/* CTA */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-2 text-xs font-semibold text-white border border-white/10 rounded-lg hover:border-primary-600/50 hover:bg-primary-950/40 transition-all flex items-center justify-center gap-1.5"
                >
                  View Profile <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
