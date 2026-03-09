"use client";

import { motion } from "framer-motion";
import ExhubbLogo from "@/components/ExhubbLogo";
import { Twitter, Instagram, Youtube, Linkedin, Github, Globe, ArrowUpRight, Apple, Play } from "lucide-react";
import NewsletterForm from "./NewsletterForm";

const LINKS = {
  Marketplace: [
    "Browse Products",
    "Browse Services",
    "Today's Deals",
    "Categories",
    "Trending Now",
    "New Arrivals",
  ],
  Sellers: [
    "Start Selling",
    "Seller Dashboard",
    "Seller Protection",
    "Payout Info",
    "Growth Tools",
    "Seller Academy",
  ],
  Company: [
    "About Exhubb",
    "Careers",
    "Press Kit",
    "Blog",
    "Partnerships",
    "Contact Us",
  ],
};

const SOCIALS = [
  { icon: Twitter, label: "Twitter" },
  { icon: Instagram, label: "Instagram" },
  { icon: Youtube, label: "YouTube" },
  { icon: Linkedin, label: "LinkedIn" },
  { icon: Github, label: "GitHub" },
];

export default function Footer() {
  return (
    <footer className="bg-[#030b06] border-t border-white/[0.06] relative overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-20 pointer-events-none" />

      <div className="container-wide relative z-10 pt-16 pb-8">
        {/* Top grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-14">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-2">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-4"
            >
              <ExhubbLogo variant="full" size={36} dark noAnimate />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-gray-500 text-sm leading-relaxed max-w-xs mb-6"
            >
              The world's first unified marketplace for products and services. Buy, sell, hire, and grow — all in one place.
            </motion.p>

            {/* Download badges */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="flex flex-col sm:flex-row gap-2.5 mb-6"
            >
              <a href="#" className="flex items-center gap-2 bg-white/[0.06] hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 transition-all group">
                <Apple className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors flex-shrink-0" />
                <div>
                  <p className="text-gray-500 text-[9px] uppercase tracking-wide leading-none mb-0.5">Download on</p>
                  <p className="text-white text-xs font-semibold leading-none">App Store</p>
                </div>
                <ArrowUpRight className="w-3 h-3 text-gray-600 group-hover:text-primary-400 ml-auto transition-colors" />
              </a>
              <a href="#" className="flex items-center gap-2 bg-white/[0.06] hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 transition-all group">
                <Play className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors flex-shrink-0" />
                <div>
                  <p className="text-gray-500 text-[9px] uppercase tracking-wide leading-none mb-0.5">Get it on</p>
                  <p className="text-white text-xs font-semibold leading-none">Google Play</p>
                </div>
                <ArrowUpRight className="w-3 h-3 text-gray-600 group-hover:text-primary-400 ml-auto transition-colors" />
              </a>
            </motion.div>

            {/* Socials */}
            <div className="flex items-center gap-2">
              {SOCIALS.map((s, i) => (
                <motion.a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  whileHover={{ scale: 1.15 }}
                  className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-primary-950/60 border border-white/[0.08] hover:border-primary-800/50 flex items-center justify-center text-gray-500 hover:text-primary-400 transition-all"
                >
                  <s.icon className="w-3.5 h-3.5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([heading, items], ci) => (
            <motion.div
              key={heading}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + ci * 0.08 }}
            >
              <p className="text-white text-sm font-bold mb-4">{heading}</p>
              <ul className="space-y-2.5">
                {items.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-gray-500 hover:text-primary-400 text-sm transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Newsletter bar */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
        >
          <div className="flex-shrink-0">
            <p className="text-white font-bold text-sm mb-0.5">Stay in the loop</p>
            <p className="text-gray-500 text-xs">Deals, product drops, and marketplace news in your inbox.</p>
          </div>
          <NewsletterForm />
        </motion.div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.05] pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-gray-600 text-xs">
            © {new Date().getFullYear()} Exhubb, Inc. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {["Privacy Policy", "Terms of Service", "Cookie Policy", "Accessibility"].map((t) => (
              <a key={t} href="#" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
                {t}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Globe className="w-3.5 h-3.5" />
            <select className="bg-transparent text-gray-500 text-xs focus:outline-none cursor-pointer">
              <option>English (US)</option>
              <option>Français</option>
              <option>Español</option>
              <option>中文</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
}
