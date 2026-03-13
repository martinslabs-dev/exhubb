"use client";

import { useState } from "react";
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

function useCountdown(targetHours = 8) {
  const [time, setTime] = useState({ h: targetHours, m: 0, s: 0 });

  useState(() => {
    const end = Date.now() + targetHours * 3600 * 1000;
    const id = setInterval(() => {
      const diff = Math.max(0, end - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime({ h, m, s });
    }, 1000);
    return () => clearInterval(id);
  });

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

type Deal = {
  id: string;
  icon?: string;
  category: string;
  title: string;
  original: number | null;
  current: number;
  rating?: number | null;
  reviews?: number | null;
  seller?: string | null;
  verified?: boolean;
  freeShipping?: boolean;
  badge?: string | null;
  hot?: boolean;
};

export default function TodaysDealsClient({ deals, filters }: { deals: Deal[]; filters: string[] }) {
  const FILTERS = ["All", ...filters];
  const [filter, setFilter] = useState(FILTERS[0] ?? "All");
  const [liked, setLiked]   = useState<Set<string>>(new Set());
  const time = useCountdown(8);

  const filtered = filter === "All" ? deals : deals.filter((d) => d.category === filter);

  function formatNaira(v: number) {
    return `₦${v.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
  }

  return (
    <section className="section-padding bg-white">
      <div className="container-wide">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <p className="section-chip bg-red-50 text-red-600 mb-1 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" /> Flash Sale
            </p>
            <h2 className="heading-lg text-gray-900">Today&apos;s Deals</h2>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex items-center gap-4">
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
            <a href="/products" className="arrow-link hidden sm:flex text-sm font-semibold text-primary-700 hover:text-primary-600">
              See All <ArrowRight className="arrow w-4 h-4" />
            </a>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap mb-8 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map((f) => (
            <motion.button key={f} onClick={() => setFilter(f)} whileTap={{ scale: 0.96 }} className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              filter === f ? "bg-primary-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}>
              {f}
            </motion.button>
          ))}
        </div>

        {/* Grid */}
        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((deal, i) => (
              <motion.div layout key={deal.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.4, delay: i * 0.06 }} className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden card-lift hover:border-primary-200">
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 h-44 flex items-center justify-center overflow-hidden">
                  {deal.imageUrl ? (
                    <img src={deal.imageUrl} alt={deal.title} className="object-contain w-full h-44" />
                  ) : (
                    (() => { const Icon = ICON_MAP[deal.icon ?? "Smartphone"]; return (
                      <motion.div whileHover={{ scale: 1.15, rotate: -5 }} transition={spring.bouncy} className="text-gray-300 select-none">
                        <Icon className="w-16 h-16" />
                      </motion.div>
                    ); })()
                  )}

                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {deal.badge && <span className="bg-red-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-sm">{deal.badge}</span>}
                    {deal.hot && (
                      <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Flame className="w-2.5 h-2.5" /> HOT</span>
                    )}
                  </div>

                  <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={(e) => { e.preventDefault(); setLiked((prev) => { const next = new Set(prev); next.has(deal.id) ? next.delete(deal.id) : next.add(deal.id); return next; }); }} className="absolute top-3 right-3 p-2 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart className={cn("w-4 h-4 transition-colors", liked.has(deal.id) ? "fill-red-500 text-red-500" : "text-gray-400")} />
                  </motion.button>

                  {deal.freeShipping && <span className="absolute bottom-3 right-3 bg-primary-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">Free Shipping</span>}
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-gray-500">{deal.seller}</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Star className="w-3.5 h-3.5 text-yellow-400" /> {deal.rating ?? "—"} <span className="text-gray-300">·</span> {deal.reviews ?? "—"}
                    </div>
                  </div>

                  <a href={`/products/${deal.id}`} className="text-sm font-semibold text-gray-900 block mb-2 line-clamp-2">{deal.title}</a>

                  <div className="flex items-baseline gap-2">
                    {deal.original ? (<span className="text-xs text-gray-400 line-through">{formatNaira(deal.original)}</span>) : null}
                    <span className="text-lg font-extrabold text-gray-900">{formatNaira(deal.current)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
