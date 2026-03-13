"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle2, ArrowRight, DollarSign, Star, Package } from "lucide-react";
import { useSession } from "next-auth/react";

const perks = [
  "Free to list — no upfront fees",
  "Sell products & offer services from one profile",
  "Get paid in 160+ countries via Stripe",
  "AI assistant writes your listings for you",
  "Join 500,000+ sellers earning on Exhubb",
  "24/7 seller support & protection",
];

const floatingBadges = [
  { icon: "DollarSign", text: "$12,400 earned this month", delay: 0 },
  { icon: "Star", text: "Top Rated Seller badge earned", delay: 0.5 },
  { icon: "Package", text: "247 orders completed", delay: 1 },
];

const BADGE_ICON_MAP: Record<string, any> = {
  DollarSign,
  Star,
  Package,
};

export default function BecomeASeller() {
  const { data: session } = useSession();

  const sellerHref = session?.user ? "/dashboard/seller" : "/register?intent=seller";
  const freelancerHref = session?.user ? "/dashboard/freelancer" : "/register?intent=seller";

  return (
    <section className="section-padding bg-gray-900 relative overflow-hidden">
      {/* BG */}
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(34,197,94,0.12)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_120%,rgba(234,179,8,0.06)_0%,transparent_70%)] pointer-events-none" />

      {/* Floating cards (decorative) */}
      {floatingBadges.map((b, i) => {
        const BadgeIcon = BADGE_ICON_MAP[b.icon] ?? DollarSign;
        return (
          <motion.div
            key={b.text}
            initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 + b.delay, duration: 0.5 }}
            className="absolute hidden lg:block"
            style={{
              top: `${20 + i * 28}%`,
              left: i === 1 ? "auto" : "3%",
              right: i === 1 ? "3%" : "auto",
            }}
          >
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: b.delay }} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-sm">
              <BadgeIcon className="w-4 h-4 text-primary-400 flex-shrink-0" />
              <span className="text-xs text-white/70 font-medium whitespace-nowrap">{b.text}</span>
            </motion.div>
          </motion.div>
        );
      })}

      <div className="container-tight relative z-10 text-center">
        {/* Eyebrow */}
        <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="section-chip bg-primary-950/60 text-primary-400 border border-primary-800/40 mb-4 mx-auto w-fit">
          Start Earning Today
        </motion.p>

        {/* Headline */}
        <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="heading-lg text-white mb-4">
          Turn Your Skills &amp; Products<br />
          Into <span className="text-gradient-gold">Real Income</span>
        </motion.h2>

        <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-gray-400 max-w-xl mx-auto mb-8 text-lg leading-relaxed">
          Join 500,000+ sellers from 160 countries. Whether you sell handmade products or offer digital services — your store is ready in minutes.
        </motion.p>

        {/* Perks list */}
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl mx-auto mb-10 text-left">
          {perks.map((p, i) => (
            <motion.div key={p} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.35 + i * 0.06 }} className="flex items-center gap-2.5 text-sm text-gray-300">
              <CheckCircle2 className="w-4 h-4 text-primary-500 flex-shrink-0" />
              {p}
            </motion.div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.55 }} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <motion.div whileHover={{ scale: 1.04, boxShadow: "0 0 36px rgba(34,197,94,0.4)" }} whileTap={{ scale: 0.97 }}>
            <Link href={sellerHref} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-bold px-7 py-3.5 rounded-full text-base shadow-lg shadow-primary-900/40 transition-all">
              Start Selling Products <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link href={freelancerHref} className="flex items-center gap-2 border border-white/20 hover:border-primary-600/50 bg-white/5 hover:bg-primary-950/50 text-white font-semibold px-7 py-3.5 rounded-full text-base transition-all">
              Offer Your Services
            </Link>
          </motion.div>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.7 }} className="text-xs text-gray-600">
          No listing fees · Global payouts · Cancel anytime
        </motion.p>
      </div>
    </section>
  );
}
