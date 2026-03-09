"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ShoppingCart, Bell, Menu, X,
  ChevronDown, Sparkles, Store, Briefcase, LogIn, UserPlus,
  Monitor, Shirt, Car, Home, Trophy, Palette, Code2, TrendingUp, PenLine, Music,
  ShoppingBag, Flame, HelpCircle, ArrowRight, LayoutDashboard, LogOut,
  BookOpen, FileDown, PlayCircle, ImagePlay, Headphones, FileText,
  Dumbbell, Heart, Tag, Layers,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ExhubbLogo from "@/components/ExhubbLogo";
import Link from "next/link";
import Image from "next/image";
import { getCartCountAction } from "@/lib/actions/cart";

const DRAWER_ICON_MAP: Record<string, LucideIcon> = {
  ShoppingBag, Briefcase, Flame, TrendingUp, Store, HelpCircle,
};

// ── Amazon-style grouped menu data ────────────────────────────
const CATEGORY_GROUPS = [
  {
    heading: "Shop by Category",
    items: [
      { label: "Electronics & Tech",  icon: Monitor,  href: "/products?category=Electronics"      },
      { label: "Fashion & Apparel",   icon: Shirt,    href: "/products?category=Fashion"           },
      { label: "Motors & Vehicles",   icon: Car,      href: "/products?category=Motors"            },
      { label: "Home & Garden",       icon: Home,     href: "/products?category=Home+%26+Garden"   },
      { label: "Sports & Outdoors",   icon: Dumbbell, href: "/products?category=Sports"            },
      { label: "Beauty & Health",     icon: Heart,    href: "/products?category=Health+%26+Beauty" },
      { label: "Books",               icon: BookOpen, href: "/products?category=Books"             },
      { label: "Collectibles",        icon: Trophy,   href: "/products?category=Collectibles"      },
    ],
  },
  {
    heading: "Digital Marketplace",
    badge: "New",
    items: [
      { label: "eBooks & Documents",  icon: BookOpen,   href: "/products?category=Digital+Products&type=ebook"    },
      { label: "Software & Files",    icon: FileDown,   href: "/products?category=Digital+Products&type=software" },
      { label: "Online Courses",      icon: PlayCircle, href: "/products?category=Digital+Products&type=course"   },
      { label: "Digital Art",         icon: ImagePlay,  href: "/products?category=Digital+Products&type=art"      },
      { label: "Music & Audio",       icon: Headphones, href: "/products?category=Digital+Products&type=music"    },
      { label: "Templates & Docs",    icon: FileText,   href: "/products?category=Digital+Products&type=template" },
    ],
  },
  {
    heading: "Services",
    items: [
      { label: "Browse Freelancers",  icon: Briefcase,  href: "/services"                          },
      { label: "Design & Creative",   icon: Palette,    href: "/services?category=Design"          },
      { label: "Tech & Development",  icon: Code2,      href: "/services?category=Tech"            },
      { label: "Writing & Content",   icon: PenLine,    href: "/services?category=Writing"         },
      { label: "Marketing",           icon: TrendingUp, href: "/services?category=Marketing"       },
      { label: "Music & Audio",       icon: Music,      href: "/services?category=Music"           },
    ],
  },
];

export default function Navbar() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled,      setScrolled]      = useState(false);
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [searchFocus,   setSearchFocus]   = useState(false);
  const [catOpen,       setCatOpen]       = useState(false);
  const [searchVal,     setSearchVal]     = useState("");
  const [mobileSearch,  setMobileSearch]  = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [freshImage, setFreshImage] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    // fetch live cart count
    getCartCountAction().then(setCartCount).catch(() => {});
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fetch fresh image from DB whenever the session user changes
  useEffect(() => {
    if (!user) { setFreshImage(undefined); return; }
    fetch("/api/me/image").then((r) => r.ok ? r.json() : null).then((d) => {
      if (d?.image !== undefined) setFreshImage(d.image);
    }).catch(() => {});
  }, [user?.email]);

  // Use freshImage if loaded, else fall back to JWT image
  const avatarImage = freshImage !== undefined ? freshImage : user?.image;

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
                    className="absolute left-0 top-full mt-2 w-[620px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                  >
                    {/* Greeting row */}
                    {user && (
                      <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary-100 overflow-hidden flex items-center justify-center shrink-0">
                          {avatarImage
                            ? <Image src={avatarImage} alt="" width={28} height={28} className="object-cover" />
                            : <span className="text-xs font-bold text-primary-700">{(user.name?.[0] ?? "U").toUpperCase()}</span>}
                        </div>
                        <span className="text-sm font-semibold text-gray-800">Hello, {user.name?.split(" ")[0] ?? "there"}</span>
                      </div>
                    )}

                    {/* Grouped columns */}
                    <div className="grid grid-cols-3 divide-x divide-gray-100">
                      {CATEGORY_GROUPS.map((group) => (
                        <div key={group.heading} className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{group.heading}</p>
                            {"badge" in group && group.badge && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded-full">{group.badge}</span>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            {group.items.map((item) => {
                              const Icon = item.icon;
                              return (
                                <motion.a
                                  key={item.label}
                                  href={item.href}
                                  whileHover={{ x: 3, backgroundColor: "rgba(240,253,244,1)" }}
                                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm text-gray-700 hover:text-primary-700 transition-colors"
                                  onClick={() => setCatOpen(false)}
                                >
                                  <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                  <span className="truncate">{item.label}</span>
                                  <ChevronDown className="w-3 h-3 text-gray-300 ml-auto -rotate-90 flex-shrink-0" />
                                </motion.a>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-gray-50">
                      <a href="/products" className="text-xs font-semibold text-primary-700 hover:text-primary-800 transition-colors flex items-center gap-1">
                        Browse all products <ArrowRight className="w-3 h-3" />
                      </a>
                      <a href="/products?category=Digital+Products" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1">
                        <Layers className="w-3 h-3" /> Digital marketplace <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search Bar — hidden on mobile, visible sm+ */}
            <motion.div
              animate={{ width: searchFocus ? "100%" : "auto" }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="hidden sm:flex flex-1 max-w-xl relative"
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchVal.trim()) router.push(`/products?q=${encodeURIComponent(searchVal.trim())}`);
                }}
                className="w-full"
              >
              <div
                className={cn(
                  "flex items-center rounded-full border transition-all duration-200 overflow-hidden w-full",
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
                      type="submit"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex items-center gap-1.5 mr-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-full transition-colors whitespace-nowrap"
                    >
                      <Search className="w-3 h-3" /> Search
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              </form>
            </motion.div>

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-2 ml-auto flex-shrink-0">
              {/* Become a Seller (only when logged out) */}
              {!user && (
                <a
                  href="/register?intent=seller"
                  className="hidden lg:flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary-700 transition-colors px-3 py-2 rounded-lg hover:bg-primary-50"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Sell</span>
                </a>
              )}

              {status === "loading" ? (
                // Skeleton while session loads
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
              ) : user ? (
                <>
                  {/* Dashboard shortcut */}
                  <Link
                    href="/dashboard"
                    className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary-700 transition-colors px-3 py-2 rounded-lg hover:bg-primary-50"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden md:inline">Dashboard</span>
                  </Link>

                  {/* Avatar + dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary-100 overflow-hidden flex items-center justify-center shrink-0">
                        {avatarImage ? (
                          <Image src={avatarImage} alt={user.name ?? ""} width={32} height={32} className="object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-primary-700">
                            {(user.name?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
                          </span>
                        )}
                      </div>
                      <ChevronDown className={cn("w-3.5 h-3.5 text-gray-500 transition-transform hidden sm:block", userMenuOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                      {userMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.97 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                          >
                            <div className="px-4 py-3 border-b border-gray-50">
                              <p className="text-sm font-bold text-gray-900 truncate">{user.name ?? "User"}</p>
                              <p className="text-xs text-gray-400 truncate">{user.email}</p>
                            </div>
                            <div className="p-2">
                              <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors">
                                <LayoutDashboard className="w-4 h-4" /> Dashboard
                              </Link>
                              <Link href="/dashboard/buyer/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors">
                                <ShoppingBag className="w-4 h-4" /> My Orders
                              </Link>
                              <Link href="/cart" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors">
                                <ShoppingCart className="w-4 h-4" /> Cart
                              </Link>
                            </div>
                            <div className="p-2 border-t border-gray-50">
                              <button
                                onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <LogOut className="w-4 h-4" /> Sign Out
                              </button>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setMobileSearch(!mobileSearch)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors sm:hidden"
              >
                {mobileSearch ? <X className="w-5 h-5 text-gray-600" /> : <Search className="w-5 h-5 text-gray-600" />}
              </motion.button>

              {/* Cart */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/cart"
                  className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors flex items-center"
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
                </Link>
              </motion.div>

              {/* Notifications (authenticated) */}
              {user && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors hidden sm:flex"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full ring-2 ring-white" />
              </motion.button>
              )}

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

      {/* ── Mobile Search Bar ───────────────────────────────── */}
      <AnimatePresence>
        {mobileSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="sticky top-16 z-40 bg-white border-b border-gray-100 sm:hidden overflow-hidden"
          >
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-full border border-primary-400 shadow-[0_0_0_3px_rgba(34,197,94,0.12)] bg-white">
                <Search className="w-4 h-4 text-primary-500 flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Search products, services, freelancers..."
                  className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
                />
                {searchVal && (
                  <button onClick={() => setSearchVal("")} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  { icon: "ShoppingBag", label: "Browse Products",  href: "/products"          },
                  { icon: "Briefcase",   label: "Browse Services",  href: "/services"          },
                  { icon: "Flame",       label: "Today's Deals",    href: "/products?sort=newest" },
                  { icon: "TrendingUp",  label: "Trending",         href: "/products?sort=popular" },
                  { icon: "Store",       label: "Become a Seller",  href: "/register?intent=seller" },
                  { icon: "HelpCircle",  label: "Help & Support",   href: "/help"              },
                ].map((item) => {
                  const DrawerIcon = DRAWER_ICON_MAP[item.icon];
                  return (
                  <motion.a
                    key={item.label}
                    href={item.href}
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
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-1 pb-3">
                      <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {avatarImage ? (
                          <Image src={avatarImage} alt={user.name ?? ""} width={36} height={36} className="object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-primary-700">{(user.name?.[0] ?? "U").toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{user.name ?? "User"}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <button
                      onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <a href="/login" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      <LogIn className="w-4 h-4" /> Sign In
                    </a>
                    <a href="/register" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors">
                      <UserPlus className="w-4 h-4" /> Join Free
                    </a>
                  </>
                )}
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
