"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useState, useEffect } from "react";
import {
  ShoppingBag,
  Briefcase,
  Package,
  Star,
  Globe,
  Users,
  TrendingUp,
  CheckCircle2,
  Zap,
} from "lucide-react";

// ── Activity feed ─────────────────────────────────────────────
const ACTIVITIES = [
  {
    icon: ShoppingBag,
    bg: "bg-primary-600",
    title: "New order placed",
    body: "Premium Sneakers · Lagos, Nigeria",
    amount: "₦45,000",
  },
  {
    icon: Briefcase,
    bg: "bg-gold-600",
    title: "Gig completed",
    body: "Brand Identity · Remote",
    amount: "$120 earned",
  },
  {
    icon: Package,
    bg: "bg-primary-700",
    title: "Product listed",
    body: "Sony WH-1000XM5 · Electronics",
    amount: "12 views",
  },
  {
    icon: Users,
    bg: "bg-gold-500",
    title: "Freelancer hired",
    body: "Full-Stack Dev · Weekly pay",
    amount: "Contract",
  },
  {
    icon: Star,
    bg: "bg-primary-500",
    title: "5-star review",
    body: '"Excellent work, very fast!" · Cairo',
    amount: "⭐⭐⭐⭐⭐",
  },
];

// ── Platform stats ────────────────────────────────────────────
const STATS = [
  { value: "12,400+", label: "Sellers" },
  { value: "3,800+",  label: "Jobs posted" },
  { value: "28K+",    label: "Buyers" },
  { value: "50+",     label: "Countries" },
];

// ── Feature pills ─────────────────────────────────────────────
const FEATURES = [
  { icon: ShoppingBag, label: "Buy & Sell"     },
  { icon: Briefcase,   label: "Hire Talent"    },
  { icon: Globe,       label: "Global Reach"   },
  { icon: TrendingUp,  label: "Grow Business"  },
  { icon: Zap,         label: "Fast Payments"  },
  { icon: CheckCircle2,label: "Secure Escrow"  },
];

// ── Shared animation variants ─────────────────────────────────
const cardVariants: Variants = {
  hidden:  { opacity: 0, x: 60, scale: 0.9 },
  visible: { opacity: 1, x: 0,  scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
  exit:    { opacity: 0, x: -60, scale: 0.9, transition: { duration: 0.3 } },
};

// ── Activity Card ─────────────────────────────────────────────
function ActivityCard({ activity }: { activity: typeof ACTIVITIES[number] }) {
  const Icon = activity.icon;
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 shadow-lg"
    >
      <div className={`${activity.bg} w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-semibold leading-tight truncate">{activity.title}</p>
        <p className="text-white/60 text-[11px] truncate">{activity.body}</p>
      </div>
      <span className="text-white/80 text-[11px] font-bold whitespace-nowrap">{activity.amount}</span>
    </motion.div>
  );
}

// ── Animated floating orb ─────────────────────────────────────
function FloatingOrb({
  size,
  color,
  x,
  y,
  delay,
}: {
  size: number;
  color: string;
  x: string;
  y: string;
  delay: number;
}) {
  return (
    <motion.div
      className={`absolute rounded-full blur-2xl opacity-20 ${color}`}
      style={{ width: size, height: size, left: x, top: y }}
      animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
      transition={{ duration: 5 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

// ── Animated counter ──────────────────────────────────────────
function StatCounter({ stat, delay }: { stat: typeof STATS[number]; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 + delay, duration: 0.5 }}
      className="text-center"
    >
      <p className="text-primary-300 font-black text-xl leading-none">{stat.value}</p>
      <p className="text-white/50 text-[11px] mt-0.5 font-medium uppercase tracking-wide">{stat.label}</p>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function AuthAnimation() {
  const [activityIndex, setActivityIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActivityIndex((i) => (i + 1) % ACTIVITIES.length);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-primary-950 via-primary-900 to-primary-950 flex flex-col overflow-hidden select-none">
      {/* ── Background mesh grid ── */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* ── Floating color orbs ── */}
      <FloatingOrb size={300} color="bg-primary-500" x="60%"  y="-5%"  delay={0}   />
      <FloatingOrb size={250} color="bg-gold-500"    x="-10%" y="40%"  delay={1.5} />
      <FloatingOrb size={200} color="bg-primary-700" x="55%"  y="70%"  delay={3}   />
      <FloatingOrb size={150} color="bg-gold-400"    x="20%"  y="80%"  delay={0.8} />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col h-full px-10 py-10">

        {/* Logo + tagline */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y:  0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-black text-xl tracking-tight">Exhubb</span>
          </div>
          <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-tight">
            The marketplace<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-gold-400">
              for everyone.
            </span>
          </h2>
          <p className="mt-3 text-white/60 text-sm leading-relaxed max-w-xs">
            Buy products, hire freelancers, sell your skills — all in one
            platform trusted across 50+ countries.
          </p>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          className="mt-8 flex flex-wrap gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {FEATURES.map(({ icon: Icon, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.07, duration: 0.3 }}
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.18)" }}
              className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 cursor-default"
            >
              <Icon className="w-3 h-3 text-white/70" />
              <span className="text-white/80 text-xs font-medium">{label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Live activity feed */}
        <div className="mb-6">
          <p className="text-white/40 text-[11px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-primary-400 inline-block"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            Live activity
          </p>
          <div className="h-[72px]">
            <AnimatePresence mode="wait">
              <ActivityCard key={activityIndex} activity={ACTIVITIES[activityIndex]} />
            </AnimatePresence>
          </div>
        </div>

        {/* Stats row */}
        <motion.div
          className="grid grid-cols-4 gap-4 border-t border-white/10 pt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {STATS.map((stat, i) => (
            <StatCounter key={stat.label} stat={stat} delay={i * 0.1} />
          ))}
        </motion.div>

      </div>
    </div>
  );
}
