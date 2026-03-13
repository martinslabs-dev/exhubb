"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Briefcase, ArrowRight, Monitor, Shirt, Car, Home, Trophy, Smartphone, Palette, Code2, TrendingUp, PenLine, Music, Video } from "lucide-react";
import { cn, spring } from "@/lib/utils";

type Item = { icon?: string; name: string; count: string; href?: string };

export default function DualModeSwitcherClient({ productItems, serviceItems }: { productItems: Item[]; serviceItems: Item[] }) {
  const [mode, setMode] = useState<"products" | "services">("products");
  const items = mode === "products" ? productItems : serviceItems;

  const ICON_MAP: Record<string, any> = {
    Monitor, Shirt, Car, Home, Trophy, Smartphone,
    Palette, Code2, TrendingUp, PenLine, Music, Video,
    ShoppingBag, Briefcase,
  };

  return (
    <section className="section-padding bg-gray-50 bg-dots overflow-hidden">
      <div className="container-wide">
        <div className="text-center mb-10 md:mb-14">
          <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="section-chip bg-primary-100 text-primary-700 mb-3 mx-auto w-fit">One Platform, Two Superpowers</motion.p>
          <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="heading-lg text-gray-900 mb-3">Shop Products <em className="text-primary-600 not-italic">or</em> Hire Services</motion.h2>
          <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-gray-500 max-w-lg mx-auto">The world&apos;s only marketplace where you can buy a product and hire an expert — in the same place.</motion.p>
        </div>

        <div className="flex justify-center mb-10">
          <div className="relative flex items-center bg-white rounded-2xl p-1.5 shadow-md border border-gray-200">
            <motion.div layout transition={spring.smooth} className="absolute inset-1.5 rounded-xl" style={{ background: "linear-gradient(135deg, #15803d, #16a34a)", width: `calc(50% - 6px)`, left: mode === "products" ? "6px" : "calc(50%)" }} />

            <button onClick={() => setMode("products")} className={cn("relative z-10 flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl text-sm font-bold transition-colors duration-200","min-w-[110px] sm:min-w-[150px] justify-center", mode === "products" ? "text-white" : "text-gray-500 hover:text-gray-800")}> <ShoppingBag className="w-4 h-4" /> Shop Products</button>
            <button onClick={() => setMode("services")} className={cn("relative z-10 flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl text-sm font-bold transition-colors duration-200","min-w-[110px] sm:min-w-[150px] justify-center", mode === "services" ? "text-white" : "text-gray-500 hover:text-gray-800")}> <Briefcase className="w-4 h-4" /> Hire Services</button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={mode} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {items.map((item, i) => {
              const Icon = item.icon ? ICON_MAP[item.icon] ?? Monitor : Monitor;
              return (
                <motion.a key={item.name} href={item.href ?? "#"} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.05 }} whileHover={{ scale: 1.04, y: -4 }} whileTap={{ scale: 0.97 }} className="group flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all cursor-pointer text-center">
                  <span className="text-primary-600 group-hover:text-primary-700 transition-colors"> <Icon className="w-6 h-6" /> </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-primary-700 transition-colors leading-tight">{item.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.count}</p>
                  </div>
                </motion.a>
              );
            })}
          </motion.div>
        </AnimatePresence>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-8 text-center">
          <a href={mode === "products" ? "/products" : "/gigs"} className="arrow-link text-sm font-semibold text-primary-700 hover:text-primary-600 transition-colors">Browse all categories <ArrowRight className="arrow w-4 h-4" /></a>
        </motion.div>
      </div>
    </section>
  );
}
