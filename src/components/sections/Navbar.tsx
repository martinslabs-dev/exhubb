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
  ShoppingBag, Briefcase, Flame, TrendingUp, Store, HelpCircle, FileDown,
};

// ── Amazon-style grouped menu data (normalized shape used by the dropdown)
const CATEGORY_GROUPS = [
  {
    title: "Shop by Category",
    columns: [
      {
        heading: "Popular",
        items: [
          { title: "Electronics & Tech", slug: "Electronics", link: "/products?category=Electronics" },
          { title: "Phones & Accessories", slug: "Phones & Accessories", link: "/products?category=Phones+%26+Accessories" },
          { title: "Fashion & Apparel", slug: "Fashion", link: "/products?category=Fashion" },
          { title: "Motors & Vehicles", slug: "Motors", link: "/products?category=Motors" },
          { title: "Home & Garden", slug: "Home & Garden", link: "/products?category=Home+%26+Garden" },
          { title: "Sports & Outdoors", slug: "Sports", link: "/products?category=Sports" },
          { title: "Beauty & Health", slug: "Health & Beauty", link: "/products?category=Health+%26+Beauty" },
          { title: "Books", slug: "Books", link: "/products?category=Books" },
          { title: "Collectibles", slug: "Collectibles", link: "/products?category=Collectibles" },
        ],
      },
    ],
  },
  {
    title: "Digital Marketplace",
    badge: "New",
    columns: [
      {
        heading: "Digital",
        items: [
          { title: "eBooks & Documents", slug: "ebooks", link: "/products?category=Digital+Products&type=ebook" },
          { title: "Software & Files", slug: "software", link: "/products?category=Digital+Products&type=software" },
          { title: "Online Courses", slug: "courses", link: "/products?category=Digital+Products&type=course" },
          { title: "Digital Art", slug: "digital-art", link: "/products?category=Digital+Products&type=art" },
          { title: "Music & Audio", slug: "music", link: "/products?category=Digital+Products&type=music" },
          { title: "Templates & Docs", slug: "templates", link: "/products?category=Digital+Products&type=template" },
        ],
      },
    ],
  },
  {
    title: "Services",
    columns: [
      {
        heading: "Services",
        items: [
          { title: "Browse Freelancers", slug: "freelancers", link: "/gigs" },
          { title: "Design & Creative", slug: "design", link: "/gigs?category=Design" },
          { title: "Tech & Development", slug: "tech", link: "/gigs?category=Tech" },
          { title: "Writing & Content", slug: "writing", link: "/gigs?category=Writing" },
          { title: "Marketing", slug: "marketing", link: "/gigs?category=Marketing" },
          { title: "Music & Audio", slug: "music-audio", link: "/gigs?category=Music" },
        ],
      },
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
  const [categoryGroups, setCategoryGroups] = useState<any[]>(CATEGORY_GROUPS);
  const [mobileActiveGroup, setMobileActiveGroup] = useState<number | null>(null);

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

  // Load categories menu from API (falls back to hardcoded CATEGORY_GROUPS)
  useEffect(() => {
    let mounted = true;
    fetch("/api/categories?menu=1")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!mounted || !data) return;
        // If the API returned the repo-style menu (our columned JSON), use it directly
        if (data.menu && Array.isArray(data.menu)) {
          setCategoryGroups(data.menu);
          return;
        }

        // If the API returned categories tree, convert to a single group with flattened children
        if (data.categories && Array.isArray(data.categories)) {
          const items = data.categories.flatMap((root: any) => {
            if (root.children && root.children.length) return root.children.map((c: any) => ({ title: c.name, slug: c.slug ?? c.name }));
            return [{ title: root.name, slug: root.slug ?? root.name }];
          });
          setCategoryGroups([{ title: "Shop by Category", columns: [{ heading: "All", items }] }]);
        }
      }).catch(() => {});
    return () => { mounted = false; };
  }, []);

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
                    className="absolute left-0 top-full mt-2 w-[980px] max-w-[95vw] bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-visible z-50 max-h-[50vh] mega-menu"
                    style={{ backgroundColor: '#ffffff' }}
                  >
                    {user && (
                      <div className="px-5 py-3.5 bg-white border-b border-gray-100 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary-100 overflow-hidden flex items-center justify-center shrink-0">
                          {avatarImage
                            ? <Image src={avatarImage} alt="" width={28} height={28} className="object-cover" />
                            : <span className="text-xs font-bold text-primary-700">{(user.name?.[0] ?? "U").toUpperCase()}</span>}
                        </div>
                        <span className="text-sm font-semibold text-gray-800">Hello, {user.name?.split(" ")[0] ?? "there"}</span>
                      </div>
                    )}

                    <div className="p-4 bg-white">
                      <div className="grid grid-cols-3 gap-6">
                        {categoryGroups.slice(0, 3).map((group, gi) => (
                          <div key={group.title || gi} className="flex flex-col">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">{group.title}</p>
                            <div className="flex-1 overflow-y-auto max-h-[44vh] pr-2 bg-white">
                              {(group.columns || []).map((col: any, ci: number) => (
                                <div key={ci} className="mb-4">
                                  <p className="text-sm font-semibold text-gray-800 mb-2">{col.heading}</p>
                                  <ul className="space-y-1">
                                    {(col.items || []).map((it: any) => (
                                      <li key={it.slug || it.title} className="relative">
                                        <div className="group inline-block">
                                          <a
                                            href={it.link ?? `/products?category=${encodeURIComponent(it.slug ?? it.title)}`}
                                            onClick={() => setCatOpen(false)}
                                            className="text-sm text-gray-700 hover:text-primary-700 block py-1"
                                          >
                                            {it.title}
                                          </a>

                                          {it.children && it.children.length > 0 && (
                                            <div className="hidden group-hover:block absolute left-full top-0 ml-2 w-48 max-h-[40vh] overflow-auto bg-white p-3 rounded-md shadow-lg border border-gray-100 z-50">
                                              {(it.children || []).map((child: any) => (
                                                <a
                                                  key={child.slug || child.title}
                                                  href={`/products?category=${encodeURIComponent(child.slug ?? child.title)}`}
                                                  onClick={() => setCatOpen(false)}
                                                  className="block text-sm text-gray-600 hover:text-primary-700 py-1"
                                                >
                                                  {child.title}
                                                </a>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-white">
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
              <div className="p-4">
                {/* Mobile drill-down: show top groups or active group's columns */}
                {!mobileActiveGroup && (
                  <div className="space-y-1">
                    {categoryGroups.map((g, idx) => (
                      <motion.button
                        key={g.title || idx}
                        onClick={() => setMobileActiveGroup(idx)}
                        whileTap={{ scale: 0.97 }}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <span className="font-medium">{g.title}</span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </motion.button>
                    ))}
                  </div>
                )}

                {mobileActiveGroup !== null && categoryGroups[mobileActiveGroup] && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <button onClick={() => setMobileActiveGroup(null)} className="text-sm text-primary-600 font-semibold">Back</button>
                      <p className="text-sm font-bold">{categoryGroups[mobileActiveGroup].title}</p>
                    </div>
                    <div className="space-y-2">
                      {(categoryGroups[mobileActiveGroup].columns || []).map((col: any, ci: number) => (
                        <div key={ci} className="pb-2 border-b border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 mb-1">{col.heading}</p>
                          {(col.items || []).map((it: any, ii: number) => (
                            <div key={it.slug || ii}>
                              <a
                                href={it.link ?? `/products?category=${encodeURIComponent(it.slug ?? it.title)}`}
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center justify-between px-2 py-2 text-sm text-gray-700 hover:text-primary-700"
                              >
                                <span>{it.title}</span>
                                {it.children && it.children.length ? <ChevronDown className="w-4 h-4 text-gray-400" /> : null}
                              </a>
                                            {it.children && it.children.length > 0 && (
                                            <div className="pl-3">
                                  {(it.children || []).map((child: any) => (
                                    <a
                                      key={child.slug || child.title}
                                      href={`/products?category=${encodeURIComponent(child.slug ?? child.title)}`}
                                      onClick={() => setMobileOpen(false)}
                                      className="block px-2 py-1 text-sm text-gray-600 hover:text-primary-700"
                                    >
                                      {child.title}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
