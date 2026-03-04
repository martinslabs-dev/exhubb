"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, ShoppingCart, Heart, ArrowRight, Clock, Flame, ShieldCheck,
  Smartphone, Gamepad2, Armchair, Watch, Bike, Gem, Wind, Tag,
  type LucideIcon,
} from "lucide-react";
import { cn, spring } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  Smartphone, Gamepad2, Armchair, Watch, Bike, Gem, Wind, Tag,
};

const FILTERS = ["All", "Electronics", "Fashion", "Home", "Motors", "Sports"];

const deals = [
  { id: 1, icon: "Smartphone", category: "Electronics",
    title: "Samsung Galaxy S25 Ultra 256GB Unlocked",
    original: 1199.99, current: 479.99, rating: 4.9, reviews: 1843,
    seller: "TechDeals Pro", verified: true, freeShipping: true,
    badge: "65% OFF", hot: true },
  { id: 2, icon: "Tag", category: "Fashion",
    title: "Nike Air Jordan 4 Retro Bred — Size 10",
    original: 520, current: 289, rating: 4.8, reviews: 634,
    seller: "SneakerVault", verified: true, freeShipping: true,
    badge: "44% OFF", hot: false },
  { id: 3, icon: "Gamepad2", category: "Electronics",
    title: "PS5 Slim Console — Disc Edition Bundle",
    original: 699.99, current: 399.99, rating: 4.9, reviews: 3410,
    seller: "GameZone Official", verified: true, freeShipping: true,
    badge: "43% OFF", hot: true },
  { id: 4, icon: "Armchair", category: "Home",
    title: "Herman Miller Aeron Chair — Fully Loaded",
    original: 1795, current: 890, rating: 4.7, reviews: 287,
    seller: "OfficeElite", verified: false, freeShipping: true,
    badge: "50% OFF", hot: false },
  { id: 5, icon: "Watch", category: "Electronics",
    title: "Apple Watch Ultra 2 — Alpine Loop",
    original: 799, current: 419, rating: 5.0, reviews: 912,
    seller: "AppleDealsHub", verified: true, freeShipping: false,
    badge: "48% OFF", hot: true },
  { id: 6, icon: "Bike", category: "Sports",
    title: "Specialized Allez Sprint Comp — 58cm",
    original: 2200, current: 1099, rating: 4.6, reviews: 143,
    seller: "CycleWorld", verified: true, freeShipping: false,
    badge: "50% OFF", hot: false },
  { id: 7, icon: "Gem", category: "Fashion",
    title: "Rolex Datejust 41mm — Oyster Steel",
    original: 9500, current: 6800, rating: 5.0, reviews: 56,
    seller: "LuxuryTimepiece", verified: true, freeShipping: true,
    badge: "29% OFF", hot: false },
  { id: 8, icon: "Wind", category: "Home",
    title: "Dyson V15 Detect Absolute Cordless Vacuum",
    original: 749.99, current: 349.99, rating: 4.8, reviews: 2104,
    seller: "DysonUSA", verified: true, freeShipping: true,
    badge: "53% OFF", hot: true },
];

function useCountdown(targetHours = 8) {
  const [time, setTime] = useState({ h: targetHours, m: 0, s: 0 });

  useEffect(() => {
    const end = Date.now() + targetHours * 3600 * 1000;
    const id = setInterval(() => {
      const diff = Math.max(0, end - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime({ h, m, s });
    }, 1000);
    return () => clearInterval(id);
  }, [targetHours]);

  return time;
}

function Digit({ value }: { value: number }) {
  const str = String(value).padStart(2, "0");
  return (
    <span className="font-mono font-black tabular-nums text-lg text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">
      {str}
    </span>
  );
}

export default function TodaysDeals() {
  const [filter, setFilter] = useState("All");
  const [liked, setLiked]   = useState<Set<number>>(new Set());
  const time = useCountdown(8);

  const filtered = filter === "All" ? deals : deals.filter((d) => d.category === filter);

  return (
    <section className="section-padding bg-white">
      <div className="container-wide">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="section-chip bg-red-50 text-red-600 mb-1 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" /> Flash Sale
            </p>
            <h2 className="heading-lg text-gray-900">Today&apos;s Deals</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-4"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-500" />
              <span className="text-sm text-gray-500 font-medium">Ends in:</span>
              <div className="flex items-center gap-1">
                <Digit value={time.h} />
                <span className="font-black text-gray-400">:</span>
                <Digit value={time.m} />
                <span className="font-black text-gray-400">:</span>
                <Digit value={time.s} />
              </div>
            </div>
            <a href="#" className="arrow-link hidden sm:flex text-sm font-semibold text-primary-700 hover:text-primary-600">
              See All <ArrowRight className="arrow w-4 h-4" />
            </a>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap mb-8 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map((f) => (
            <motion.button
              key={f}
              onClick={() => setFilter(f)}
              whileTap={{ scale: 0.96 }}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                filter === f
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {f}
            </motion.button>
          ))}
        </div>

        {/* Grid */}
        <motion.div
          layout
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((deal, i) => (
              <motion.div
                layout
                key={deal.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden card-lift hover:border-primary-200"
              >
              {/* Image area */}
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 h-44 flex items-center justify-center overflow-hidden">
                {(() => { const Icon = ICON_MAP[deal.icon]; return (
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: -5 }}
                    transition={spring.bouncy}
                    className="text-gray-300 select-none"
                  >
                    <Icon className="w-16 h-16" />
                  </motion.div>
                ); })()}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <span className="bg-red-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-sm">
                    {deal.badge}
                  </span>
                  {deal.hot && (
                    <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Flame className="w-2.5 h-2.5" /> HOT
                    </span>
                  )}
                </div>

                {/* Wishlist */}
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.preventDefault();
                    setLiked((prev) => {
                      const next = new Set(prev);
                      next.has(deal.id) ? next.delete(deal.id) : next.add(deal.id);
                      return next;
                    });
                  }}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Heart
                    className={cn("w-4 h-4 transition-colors", liked.has(deal.id) ? "fill-red-500 text-red-500" : "text-gray-400")}
                  />
                </motion.button>

                {/* Free shipping */}
                {deal.freeShipping && (
                  <span className="absolute bottom-3 right-3 bg-primary-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    Free Shipping
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="p-4">
                {/* Seller */}
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[9px] text-white font-bold">
                    {deal.seller[0]}
                  </div>
                  <span className="text-xs text-gray-500 truncate">{deal.seller}</span>
                  {deal.verified && <ShieldCheck className="w-3.5 h-3.5 text-primary-500 shrink-0" />}
                </div>

                {/* Title */}
                <h3 className="text-sm font-semibold text-gray-800 mb-2 line-clamp-2 leading-snug group-hover:text-primary-700 transition-colors">
                  {deal.title}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className={cn("w-3 h-3", j < Math.floor(deal.rating) ? "fill-gold-400 text-gold-400" : "text-gray-200 fill-gray-200")}
                    />
                  ))}
                  <span className="text-xs text-gray-400 ml-1">({deal.reviews.toLocaleString()})</span>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-lg font-black text-gray-900">${deal.current.toFixed(0)}</span>
                    <span className="text-xs text-gray-400 line-through ml-2">${deal.original.toFixed(0)}</span>
                  </div>
                  <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                    Save ${(deal.original - deal.current).toFixed(0)}
                  </span>
                </div>

                {/* Add to cart */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" /> Add to Cart
                </motion.button>
              </div>
            </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Mobile see all */}
        <div className="mt-6 text-center sm:hidden">
          <a href="#" className="text-sm font-semibold text-primary-700 underline underline-offset-2">
            See All Deals →
          </a>
        </div>
      </div>
    </section>
  );
}
