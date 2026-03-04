"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Star, ArrowLeft, ArrowRight, CheckCircle2,
  Palette, Code2, Video, TrendingUp, PenLine, Bot,
  type LucideIcon,
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  Palette, Code2, Video, TrendingUp, PenLine, Bot,
};

const services = [
  {
    id: 1, icon: "Palette", category: "Design & Creative",
    title: "I will design a stunning brand identity with logo & style guide",
    sellerName: "Sarah K.", sellerCountry: "US", level: "PRO",
    rating: 5.0, reviews: 2841, price: 149,
    tags: ["Logo", "Brand Identity", "Figma"],
    deliveryDays: 3,
  },
  {
    id: 2, icon: "Code2", category: "Web Development",
    title: "I will build a full-stack Next.js app with TypeScript & Tailwind",
    sellerName: "Marcus T.", sellerCountry: "GB", level: "Top Rated",
    rating: 4.9, reviews: 1203, price: 299,
    tags: ["Next.js", "TypeScript", "Tailwind"],
    deliveryDays: 5,
  },
  {
    id: 3, icon: "Video", category: "Video & Animation",
    title: "I will create a professional explainer video with motion graphics",
    sellerName: "Elena R.", sellerCountry: "DE", level: "Top Rated",
    rating: 4.8, reviews: 876, price: 199,
    tags: ["Motion Design", "After Effects", "2D Animation"],
    deliveryDays: 4,
  },
  {
    id: 4, icon: "TrendingUp", category: "Digital Marketing",
    title: "I will run high-converting Google & Meta Ads for your business",
    sellerName: "David O.", sellerCountry: "NG", level: "Level 2",
    rating: 5.0, reviews: 488, price: 89,
    tags: ["Google Ads", "Meta Ads", "ROI Focused"],
    deliveryDays: 1,
  },
  {
    id: 5, icon: "PenLine", category: "Writing & Content",
    title: "I will write SEO-optimised blog posts that rank and convert",
    sellerName: "Priya M.", sellerCountry: "IN", level: "PRO",
    rating: 4.9, reviews: 3120, price: 59,
    tags: ["SEO Writing", "Blog Posts", "Copywriting"],
    deliveryDays: 2,
  },
  {
    id: 6, icon: "Bot", category: "AI Services",
    title: "I will build a custom AI chatbot integrated with your website",
    sellerName: "Luca B.", sellerCountry: "IT", level: "Top Rated",
    rating: 4.8, reviews: 312, price: 349,
    tags: ["OpenAI", "n8n", "Python"],
    deliveryDays: 7,
  },
];

const levelColors: Record<string, string> = {
  "PRO":       "bg-gold-100 text-gold-700 border border-gold-200",
  "Top Rated": "bg-primary-100 text-primary-700 border border-primary-200",
  "Level 2":   "bg-blue-50 text-blue-600 border border-blue-100",
};

export default function FeaturedServices() {
  const autoplay = useMemo(() => Autoplay({ delay: 3500, stopOnInteraction: true }), []);
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", slidesToScroll: 1 },
    [autoplay]
  );

  return (
    <section className="section-padding bg-[#061a0e] overflow-hidden relative">
      {/* BG decorations */}
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#061a0e] to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container-wide relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="section-chip bg-primary-950 text-primary-400 border border-primary-800/50 mb-3"
            >
              Hire World-Class Talent
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="heading-lg text-white"
            >
              Top-Rated Services,<br className="hidden sm:block" /> Ready to Deliver
            </motion.h2>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => emblaApi?.scrollPrev()}
              className="w-10 h-10 rounded-full border border-white/15 text-white hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => emblaApi?.scrollNext()}
              className="w-10 h-10 rounded-full border border-white/15 text-white hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Carousel */}
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-4 sm:gap-5">
            {services.map((svc, i) => {
              const Icon = ICON_MAP[svc.icon];
              return (
              <motion.div
                key={svc.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="flex-none w-72 sm:w-80"
              >
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="glass-dark rounded-2xl overflow-hidden h-full group cursor-pointer"
                >
                  {/* Service thumbnail */}
                  <div className="relative h-40 bg-gradient-to-br from-primary-950 to-[#0f2a1a] flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-dots-dark opacity-50" />
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: -5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                      className="text-primary-500/40 relative z-10"
                    >
                      <Icon className="w-16 h-16" />
                    </motion.div>
                    <span className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-900/80 text-primary-300 border border-primary-700/40">
                      {svc.category}
                    </span>
                    <span className="absolute bottom-3 left-3 text-xs text-gray-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-primary-400" />
                      Delivery in {svc.deliveryDays}d
                    </span>
                  </div>

                  <div className="p-5">
                    {/* Seller row */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-sm font-bold text-white ring-2 ring-primary-800">
                        {svc.sellerName[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-white">{svc.sellerName}</span>
                          <span className="text-xs text-gray-500 font-medium">{svc.sellerCountry}</span>
                        </div>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", levelColors[svc.level])}>
                          {svc.level}
                        </span>
                      </div>
                      <div className="ml-auto flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-gold-400 text-gold-400" />
                        <span className="text-sm font-bold text-white">{svc.rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-500">({svc.reviews.toLocaleString()})</span>
                      </div>
                    </div>

                    {/* Title */}
                    <p className="text-sm font-semibold text-gray-100 mb-3 line-clamp-2 leading-snug group-hover:text-primary-300 transition-colors">
                      {svc.title}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {svc.tags.map((tag) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Price row */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Starting at</p>
                        <p className="text-lg font-black text-primary-400">${svc.price}</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.96 }}
                        className="text-xs font-bold px-4 py-2 bg-primary-700 hover:bg-primary-600 text-white rounded-xl transition-colors"
                      >
                        View Gig
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
              );
            })}
          </div>
        </div>

        {/* Browse all */}
        <div className="mt-10 text-center">
          <motion.a
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            href="#"
            className="inline-flex items-center gap-2 border border-white/20 hover:border-primary-500/60 bg-white/5 hover:bg-primary-950/80 text-white font-semibold px-6 py-3 rounded-full transition-all text-sm"
          >
            Browse All Services <ArrowRight className="w-4 h-4" />
          </motion.a>
        </div>
      </div>
    </section>
  );
}
