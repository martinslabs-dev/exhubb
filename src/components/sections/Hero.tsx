"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Search, Sparkles, ArrowRight, ShieldCheck, Globe, TrendingUp, ShoppingBag, Briefcase, type LucideIcon } from "lucide-react";
import { cn, spring } from "@/lib/utils";

const TABS = ["Products", "Services"] as const;

const productPlaceholders = [
  "Search electronics, fashion, collectibles…",
  "Find vintage sneakers, gaming gear…",
  "Discover home decor, rare collectibles…",
];
const servicePlaceholders = [
  "Search logo design, web development…",
  "Find video editing, SEO, copywriting…",
  "Hire React developers, UX designers…",
];

const TRUST_ICON_MAP: Record<string, LucideIcon> = { ShieldCheck, Globe, TrendingUp };

const trust = [
  { icon: "ShieldCheck", label: "Secure Payments" },
  { icon: "Globe",       label: "160+ Countries"  },
  { icon: "TrendingUp",  label: "2M+ Users"        },
];

type TabType = (typeof TABS)[number];

export default function Hero() {
  const [activeTab, setActiveTab] = useState<TabType>("Products");
  const [searchVal,  setSearchVal] = useState("");
  const [phIndex,    setPhIndex]   = useState(0);
  const containerRef               = useRef<HTMLDivElement>(null);
  const canvasRef                  = useRef<HTMLCanvasElement>(null);

  const { scrollYProgress } = useScroll({ target: containerRef });
  const opacY = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

  // Rotate placeholder text
  useEffect(() => {
    const arr = activeTab === "Products" ? productPlaceholders : servicePlaceholders;
    const id = setInterval(() => {
      setPhIndex((p) => (p + 1) % arr.length);
    }, 3000);
    setPhIndex(0);
    return () => clearInterval(id);
  }, [activeTab]);

  // Particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W(),
      y: Math.random() * H(),
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.4 + 0.1,
      color: Math.random() > 0.5 ? "#22c55e" : "#eab308",
    }));

    function draw() {
      ctx.clearRect(0, 0, W(), H());
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W()) p.vx *= -1;
        if (p.y < 0 || p.y > H()) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();

        // draw connections
        particles.forEach((q) => {
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = "#22c55e";
            ctx.globalAlpha = (1 - dist / 100) * 0.08;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  const placeholders = activeTab === "Products" ? productPlaceholders : servicePlaceholders;
  const currentPh    = placeholders[phIndex];

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#061a0e]"
    >
      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {/* Background layers */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Mesh gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(34,197,94,0.2)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_80%,rgba(234,179,8,0.08)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_10%_60%,rgba(21,128,61,0.15)_0%,transparent_60%)]" />
        {/* Grid */}
        <div className="absolute inset-0 bg-grid opacity-40" />
        {/* Glow orb */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary-600/10 blur-[120px] animate-[glow-pulse_4s_ease-in-out_infinite]" />
      </div>

      {/* ── Centered content column ─────────────────────── */}
      <div
        className="relative z-10 w-full flex flex-col items-center text-center px-4 pt-20 pb-16"
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          <span className="section-chip bg-primary-950/80 text-primary-400 border border-primary-800/50 inline-flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            World&apos;s First Hybrid Marketplace
          </span>
        </motion.div>

        {/* Headline */}
        <div className="mb-4 overflow-hidden">
          {[
            { text: "Buy Products.",  cls: "text-white" },
            { text: "Hire Talent.",   cls: "text-gradient-green" },
            { text: "One Platform.",  cls: "text-gradient-gold" },
          ].map(({ text, cls }, i) => (
            <motion.div
              key={text}
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.75, delay: 0.15 + i * 0.13, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className={cn("text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-black tracking-tight leading-[1.1] block", cls)}>{text}</h1>
            </motion.div>
          ))}
        </div>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="text-sm md:text-base text-gray-300/80 mb-5 max-w-2xl leading-relaxed"
        >
          Shop millions of products{" "}
          <em className="text-primary-400 not-italic font-semibold">or</em> hire world-class
          freelancers — with one trusted profile, secure payments, and global delivery in{" "}
          <em className="text-gold-400 not-italic font-semibold">160+ countries</em>.
        </motion.p>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.82 }}
          className="w-full max-w-2xl mb-5"
        >
          {/* Tab switcher — centered */}
          <div className="flex justify-center mb-2">
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setPhIndex(0); }}
                  className={cn(
                    "relative px-5 py-1.5 text-sm font-semibold rounded-lg transition-colors duration-150",
                    activeTab === tab ? "text-white" : "text-gray-400 hover:text-gray-200"
                  )}
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId="hero-tab"
                      className="absolute inset-0 bg-primary-700 rounded-lg"
                      transition={spring.smooth}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {tab === "Products"
                      ? <ShoppingBag className="w-3.5 h-3.5" />
                      : <Briefcase   className="w-3.5 h-3.5" />}
                    {tab}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="flex items-center rounded-2xl bg-white/[0.07] backdrop-blur-md border border-white/[0.12] overflow-hidden focus-within:border-primary-500/70 focus-within:shadow-[0_0_0_3px_rgba(34,197,94,0.18)] transition-all duration-200">
            <Search className="w-5 h-5 ml-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1 relative overflow-hidden">
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full px-4 py-3 bg-transparent text-white outline-none text-sm sm:text-base placeholder-transparent"
              />
              {!searchVal && (
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentPh}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0 flex items-center px-4 text-sm sm:text-base text-gray-500 pointer-events-none select-none"
                  >
                    {currentPh}
                  </motion.span>
                </AnimatePresence>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="m-2 flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors shadow-lg shadow-primary-900/30"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </motion.button>
          </div>

          {/* Trending tags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex flex-wrap items-center justify-center gap-2 mt-2"
          >
            <span className="text-xs text-gray-500">Trending:</span>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-wrap items-center justify-center gap-2"
              >
                {(activeTab === "Products"
                  ? ["iPhone 16", "Vintage Watches", "Sneakers", "Gaming PC"]
                  : ["Logo Design", "React Dev", "SEO", "Video Editing"]
                ).map((tag) => (
                  <motion.a
                    key={tag}
                    href="#"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-3 py-1 bg-white/5 hover:bg-primary-900/60 border border-white/10 hover:border-primary-700/50 rounded-full text-xs text-gray-400 hover:text-primary-300 transition-all"
                  >
                    {tag}
                  </motion.a>
                ))}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* CTA Buttons — inside the flow, below search */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-5"
        >
          <motion.a
            whileHover={{ scale: 1.04, boxShadow: "0 0 48px rgba(34,197,94,0.6)" }}
            whileTap={{ scale: 0.97 }}
            href="/search"
            className="flex items-center gap-2.5 bg-primary-500 hover:bg-primary-400 text-white font-extrabold px-8 py-3 rounded-full text-sm ring-2 ring-primary-400/40 ring-offset-2 ring-offset-transparent shadow-[0_0_32px_rgba(34,197,94,0.35)] transition-all"
          >
            Start Shopping <ArrowRight className="w-4 h-4" />
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.04, boxShadow: "0 0 24px rgba(255,255,255,0.1)" }}
            whileTap={{ scale: 0.97 }}
            href="/register?intent=freelancer"
            className="flex items-center gap-2.5 border-2 border-white/50 hover:border-white/80 bg-white/10 hover:bg-white/15 text-white font-bold px-8 py-3 rounded-full text-sm backdrop-blur-sm transition-all"
          >
            Offer Your Services
          </motion.a>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="flex flex-wrap items-center justify-center gap-5"
        >
          {trust.map((t) => {
            const TrustIcon = TRUST_ICON_MAP[t.icon];
            return (
            <div key={t.label} className="flex items-center gap-1.5 text-xs text-gray-500">
              <TrustIcon className="w-4 h-4 text-primary-500" />
              {t.label}
            </div>
            );
          })}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        style={{ opacity: opacY }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1"
      >
        <span className="text-xs text-gray-600">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-2 bg-primary-500 rounded-full" />
        </motion.div>
      </motion.div>

      {/* Bottom gradient fade into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#061a0e] to-transparent z-10 pointer-events-none" />
    </section>
  );
}
