"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  Sparkles, ArrowRight, Zap, Shield, TrendingUp, Target,
  Palette, PenLine, ImageIcon,
  type LucideIcon,
} from "lucide-react";

const FEATURE_ICON_MAP: Record<string, LucideIcon> = {
  Target, Zap, Sparkles, Shield, TrendingUp,
};

const CARD_ICON_MAP: Record<string, LucideIcon> = {
  Palette, PenLine, ImageIcon,
};

const features = [
  { icon: "Target",     label: "Intent-Based Search",      desc: "Understands what you actually mean, not just keywords" },
  { icon: "Zap",        label: "Personalized for You",      desc: "Learns your preferences and surfaces relevant listings" },
  { icon: "Sparkles",   label: "AI Listing Assistant",      desc: "Sellers get AI-generated titles, descriptions & pricing" },
  { icon: "Shield",     label: "Fraud & Quality Detection", desc: "AI flags suspicious listings before they reach you" },
  { icon: "TrendingUp", label: "Smart Price Insights",      desc: "Know if a deal is genuinely good before you buy" },
];

const DEMO_MESSAGES = [
  { type: "user",   text: "I need branding for my coffee startup" },
  { type: "ai",     text: "I found 24 top-rated designers who specialize in food & beverage branding." },
  { type: "result", cards: [
    { icon: "Palette",   name: "Alex K.",  rating: 5.0, price: "$149", tag: "Brand Identity" },
    { icon: "PenLine",   name: "Maria G.", rating: 4.9, price: "$89",  tag: "Logo + Style Guide" },
    { icon: "ImageIcon", name: "Jin L.",   rating: 4.8, price: "$199", tag: "Full Brand Package" },
  ]},
];

export default function AIFeature() {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      setStep((s) => {
        const next = s + 1;
        if (next >= DEMO_MESSAGES.length - 1) clearInterval(id);
        return Math.min(next, DEMO_MESSAGES.length - 1);
      });
    }, 2200);
    return () => clearInterval(id);
  }, [inView]);

  return (
    <section className="section-padding bg-gradient-to-br from-primary-700 via-primary-600 to-gold-600 relative overflow-hidden">
      {/* BG */}
      <div className="absolute inset-0 bg-grid opacity-[0.15] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-900/30 rounded-full blur-[100px] pointer-events-none" />

      <div className="container-wide relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full bg-white/15 border border-white/25 text-white text-xs font-semibold tracking-widest uppercase"
            >
              <Sparkles className="w-3.5 h-3.5 text-gold-300" />
              Powered by AI
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="heading-lg text-white mb-4"
            >
              Search Smarter,<br /> Not Harder
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-white/80 text-lg mb-8 max-w-lg leading-relaxed"
            >
              Type what you&apos;re looking for in plain English. Our AI understands intent — not just keywords — and surfaces exactly the right
              products and services for you.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="space-y-3 mb-8"
            >
              {features.map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.35 + i * 0.07 }}
                  className="flex items-start gap-3 group"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white flex-shrink-0 group-hover:bg-white/25 transition-colors">
                    {(() => { const FIcon = FEATURE_ICON_MAP[f.icon]; return <FIcon className="w-4 h-4" />; })()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.label}</p>
                    <p className="text-xs text-white/60">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.a
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              href="#"
              className="inline-flex items-center gap-2 bg-white text-primary-700 font-bold px-6 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all text-sm"
            >
              <Sparkles className="w-4 h-4" /> Try AI Search <ArrowRight className="w-4 h-4" />
            </motion.a>
          </div>

          {/* Right: Animated chat demo */}
          <div ref={ref} className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 shadow-2xl"
            >
              {/* Header bar */}
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/15">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-gold-200" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Exhubb AI</p>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] text-white/60">Online · Instant results</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-3 min-h-[280px]">
                {DEMO_MESSAGES.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={step >= i ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                    transition={{ duration: 0.4 }}
                  >
                    {msg.type === "user" && (
                      <div className="flex justify-end">
                        <div className="bg-white text-primary-700 text-sm font-medium px-4 py-2.5 rounded-2xl rounded-br-md max-w-[80%] shadow-sm">
                          {msg.text}
                        </div>
                      </div>
                    )}
                    {msg.type === "ai" && (
                      <div className="flex justify-start">
                        <div className="bg-white/15 text-white text-sm px-4 py-2.5 rounded-2xl rounded-bl-md max-w-[80%]">
                          {msg.text}
                          {step === i && (
                            <span className="ml-0.5 w-0.5 h-3.5 bg-white/70 inline-block cursor-blink" />
                          )}
                        </div>
                      </div>
                    )}
                    {msg.type === "result" && msg.cards && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {msg.cards.map((card, j) => (
                          <motion.div
                            key={card.name}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={step >= i ? { opacity: 1, scale: 1 } : {}}
                            transition={{ delay: j * 0.1 }}
                            className="bg-white/10 border border-white/20 rounded-xl p-3 text-center"
                          >
                            {(() => { const CIcon = CARD_ICON_MAP[card.icon]; return <div className="flex justify-center mb-1"><CIcon className="w-5 h-5 text-white/70" /></div>; })()}
                            <p className="text-[11px] font-bold text-white">{card.name}</p>
                            <p className="text-[10px] text-white/60">{card.tag}</p>
                            <p className="text-xs font-black text-gold-300 mt-1">{card.price}</p>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Input bar */}
              <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5 border border-white/15">
                <span className="text-xs text-white/40 flex-1">Ask Exhubb AI anything…</span>
                <Sparkles className="w-4 h-4 text-gold-300" />
              </div>
            </motion.div>

            {/* Floating stat badge */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-4 -left-4 bg-white rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-2"
            >
              <Zap className="w-5 h-5 text-gold-500" />
              <div>
                <p className="text-xs font-black text-gray-900">0.3s avg search</p>
                <p className="text-[10px] text-gray-400">Faster than competitors</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
