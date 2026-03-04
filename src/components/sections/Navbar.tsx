"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ShoppingCart, Bell, Menu, X,
  ChevronDown, Sparkles, Store, Briefcase, LogIn, UserPlus,
  Monitor, Shirt, Car, Home, Trophy, Palette, Code2, TrendingUp, PenLine, Music,
  ShoppingBag, Flame, HelpCircle, ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ExhubbLogo from "@/components/ExhubbLogo";
import Link from "next/link";

const CAT_ICON_MAP: Record<string, LucideIcon> = {
  Monitor, Shirt, Car, Home, Trophy, Palette, Code2, TrendingUp, PenLine, Music,
};

const DRAWER_ICON_MAP: Record<string, LucideIcon> = {
  ShoppingBag, Briefcase, Flame, TrendingUp, Store, HelpCircle,
};

const categories = [
  { label: "Electronics",       icon: "Monitor"     },
  { label: "Fashion",           icon: "Shirt"       },
  { label: "Motors",            icon: "Car"         },
  { label: "Home & Garden",     icon: "Home"        },
  { label: "Collectibles",      icon: "Trophy"      },
  { label: "Design & Creative", icon: "Palette"     },
  { label: "Tech & Dev",        icon: "Code2"       },
  { label: "Marketing",         icon: "TrendingUp"  },
  { label: "Writing",           icon: "PenLine"     },
  { label: "Music & Audio",     icon: "Music"       },
];

export default function Navbar() {
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);
  const [catOpen,     setCatOpen]     = useState(false);
  const [searchVal,   setSearchVal]   = useState("");
  const [cartCount]                   = useState(3);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* ── Announcement Banner ─────────────────────────────── */}
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        className="bg-gradient-to-r from-primary-700 via-primary-600 to-primary-700 text-white text-xs sm:text-sm font-medium text-center py-2 px-4 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <span className="relative flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-gold-300 animate-[spin_3s_linear_infinite]" />
          <span className="hidden sm:inline">Introducing </span>
          <strong className="text-gold-300">Exhubb Pro</strong>
          <span className="hidden sm:inline"> — Buy products &amp; hire talent on one platform.</span>
          <span className="sm:hidden"> — Products + Services unified.</span>
          <a href="#" className="underline underline-offset-2 hover:text-gold-200 transition-colors ml-1 inline-flex items-center gap-1">
            Explore now <ArrowRight className="w-3 h-3" />
          </a>
          <Sparkles className="w-3.5 h-3.5 text-gold-300 animate-[spin_3s_linear_infinite_reverse]" />
        </span>
      </motion.div>

      {/* ── Main Navigation ─────────────────────────────────── */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "sticky top-0 z-50 h-16 flex items-center w-full transition-all duration-300",
          scrolled
            ? "glass-nav shadow-sm"
            : "bg-white/95 border-b border-gray-100/60"
        )}
      >
        <div className="container-wide w-full">
          <div className="flex items-center gap-3 lg:gap-6">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 flex-shrink-0 group"
            >
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <ExhubbLogo variant="full" size={32} noAnimate />
              </motion.div>
            </Link>

            {/* Categories Dropdown */}
            <div className="relative hidden md:block">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setCatOpen(!catOpen)}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary-700 transition-colors px-3 py-2 rounded-lg hover:bg-primary-50 focus-ring"
              >
                <Menu className="w-4 h-4" />
                <span>Explore</span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", catOpen && "rotate-180")} />
              </motion.button>

              <AnimatePresence>
                {catOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                  >
                    <div className="p-2">
                    {categories.map((cat) => {
                        const CatIcon = CAT_ICON_MAP[cat.icon];
                        return (
                        <motion.a
                          key={cat.label}
                          href="#"
                          whileHover={{ x: 4, backgroundColor: "rgba(240,253,244,1)" }}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-700 hover:text-primary-700 transition-colors"
                          onClick={() => setCatOpen(false)}
                        >
                          <CatIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          {cat.label}
                        </motion.a>
                        );
                      })}
                    </div>
                    <div className="border-t border-gray-100 p-2">
                      <a href="#" className="flex items-center justify-center gap-1 text-xs font-semibold text-primary-700 py-2 hover:text-primary-800 transition-colors arrow-link">
                        View all categories <span className="arrow">→</span>
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search Bar */}
            <motion.div
              animate={{ width: searchFocus ? "100%" : "auto" }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="flex-1 max-w-xl relative"
            >
              <div
                className={cn(
                  "flex items-center rounded-full border transition-all duration-200 overflow-hidden",
                  searchFocus
                    ? "border-primary-500 shadow-[0_0_0_3px_rgba(34,197,94,0.15)] bg-white"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300"
                )}
              >
                <Search className={cn("w-4 h-4 ml-4 flex-shrink-0 transition-colors", searchFocus ? "text-primary-600" : "text-gray-400")} />
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  onFocus={() => setSearchFocus(true)}
                  onBlur={() => setSearchFocus(false)}
                  placeholder="Search products, services, freelancers..."
                  className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400 min-w-0"
                />
                <AnimatePresence>
                  {searchFocus && (
                    <motion.button
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex items-center gap-1.5 mr-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-full transition-colors whitespace-nowrap"
                    >
                      <Sparkles className="w-3 h-3" /> AI Search
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-2 ml-auto flex-shrink-0">
              {/* Become a Seller */}
              <a
                href="/register?intent=seller"
                className="hidden lg:flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary-700 transition-colors px-3 py-2 rounded-lg hover:bg-primary-50"
              >
                <Briefcase className="w-4 h-4" />
                <span>Sell</span>
              </a>

              {/* Sign In */}
              <motion.a
                whileTap={{ scale: 0.97 }}
                href="/login"
                className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-primary-700 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden md:inline">Sign In</span>
              </motion.a>

              {/* Join Free */}
              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                href="/register"
                className="hidden sm:flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>Join Free</span>
              </motion.a>

              {/* Cart */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-gold-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Notifications (authenticated) */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors hidden sm:flex"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full ring-2 ring-white" />
              </motion.button>

              {/* Mobile Menu Toggle */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors md:hidden"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ── Mobile Drawer ────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="fixed right-0 top-0 bottom-0 w-72 bg-white z-50 shadow-2xl md:hidden overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <ExhubbLogo variant="full" size={28} noAnimate />
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-1">
                {[
                  { icon: "ShoppingBag", label: "Browse Products"  },
                  { icon: "Briefcase",   label: "Browse Services"  },
                  { icon: "Flame",       label: "Today's Deals"    },
                  { icon: "TrendingUp",  label: "Trending"         },
                  { icon: "Store",       label: "Become a Seller"  },
                  { icon: "HelpCircle",  label: "Help & Support"   },
                ].map((item) => {
                  const DrawerIcon = DRAWER_ICON_MAP[item.icon];
                  return (
                  <motion.a
                    key={item.label}
                    href="#"
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    <DrawerIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </motion.a>
                  );
                })}
              </div>
              <div className="p-4 border-t border-gray-100 space-y-2">
                <a href="/login" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <LogIn className="w-4 h-4" /> Sign In
                </a>
                <a href="/register" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors">
                  <UserPlus className="w-4 h-4" /> Join Free
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Backdrop for category dropdown */}
      {catOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setCatOpen(false)} />
      )}
    </>
  );
}
