"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Briefcase, ArrowRight,
  Monitor, Shirt, Car, Home, Trophy, Smartphone,
  Palette, Code2, TrendingUp, PenLine, Music, Video,
} from "lucide-react";
import { cn, spring } from "@/lib/utils";

const MODES = [
  { id: "products", label: "Shop Products", icon: <ShoppingBag className="w-4 h-4" /> },
  { id: "services", label: "Hire Services",  icon: <Briefcase   className="w-4 h-4" /> },
] as const;

type Mode = (typeof MODES)[number]["id"];

const productCategories = [
  { icon: <Monitor    className="w-6 h-6" />, name: "Electronics",   count: "2.4M listings" },
  { icon: <Shirt      className="w-6 h-6" />, name: "Fashion",       count: "1.8M listings" },
  { icon: <Car        className="w-6 h-6" />, name: "Motors",        count: "890K listings" },
  { icon: <Home       className="w-6 h-6" />, name: "Home & Garden", count: "1.1M listings" },
  { icon: <Trophy     className="w-6 h-6" />, name: "Collectibles",  count: "3.2M listings" },
  { icon: <Smartphone className="w-6 h-6" />, name: "Smartphones",   count: "560K listings" },
];

const serviceCategories = [
  { icon: <Palette    className="w-6 h-6" />, name: "Design & Creative",  count: "180K freelancers" },
  { icon: <Code2      className="w-6 h-6" />, name: "Tech & Programming", count: "240K freelancers" },
  { icon: <TrendingUp className="w-6 h-6" />, name: "Digital Marketing",  count: "120K freelancers" },
  { icon: <PenLine    className="w-6 h-6" />, name: "Writing & Content",  count: "90K freelancers"  },
  { icon: <Music      className="w-6 h-6" />, name: "Music & Audio",      count: "45K freelancers"  },
  { icon: <Video      className="w-6 h-6" />, name: "Video & Animation",  count: "78K freelancers"  },
];

export default function DualModeSwitcher() {
  const [mode, setMode] = useState<Mode>("products");

  const items = mode === "products" ? productCategories : serviceCategories;

  return (
    <section className="section-padding bg-gray-50 bg-dots overflow-hidden">
      <div className="container-wide">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-chip bg-primary-100 text-primary-700 mb-3 mx-auto w-fit"
          >
            One Platform, Two Superpowers
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="heading-lg text-gray-900 mb-3"
          >
            Shop Products <em className="text-primary-600 not-italic">or</em> Hire Services
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 max-w-lg mx-auto"
          >
            The world&apos;s only marketplace where you can buy a product and hire an expert — in the same place.
          </motion.p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-10">
          <div className="relative flex items-center bg-white rounded-2xl p-1.5 shadow-md border border-gray-200">
            {/* Sliding background */}
            <motion.div
              layout
              transition={spring.smooth}
              className="absolute inset-1.5 rounded-xl"
              style={{
                background: "linear-gradient(135deg, #15803d, #16a34a)",
                width: `calc(50% - 6px)`,
                left: mode === "products" ? "6px" : "calc(50%)",
              }}
            />
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  "relative z-10 flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-colors duration-200",
                  "min-w-[150px] sm:min-w-[180px] justify-center",
                  mode === m.id ? "text-white" : "text-gray-500 hover:text-gray-800"
                )}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
          >
            {items.map((item, i) => (
              <motion.a
                key={item.name}
                href="#"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                whileHover={{ scale: 1.04, y: -4 }}
                whileTap={{ scale: 0.97 }}
                className="group flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all cursor-pointer text-center"
              >
                <span className="text-primary-600 group-hover:text-primary-700 transition-colors">
                  {item.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-primary-700 transition-colors leading-tight">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.count}</p>
                </div>
              </motion.a>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* CTA link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <a href="#" className="arrow-link text-sm font-semibold text-primary-700 hover:text-primary-600 transition-colors">
            Browse all categories <ArrowRight className="arrow w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
