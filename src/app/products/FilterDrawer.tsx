"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, SlidersHorizontal, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "All", "Electronics", "Fashion", "Motors", "Home & Garden",
  "Collectibles", "Sports", "Beauty", "Books", "Digital Products", "Other",
];

const ZONES = [
  { value: "NIGERIA",       label: "🇳🇬 Ships to Nigeria" },
  { value: "AFRICA",        label: "🌍 Ships to Africa" },
  { value: "INTERNATIONAL", label: "🌐 Ships Internationally" },
];

const RATINGS = [
  { value: "4", label: "4★ & up" },
  { value: "3", label: "3★ & up" },
  { value: "2", label: "2★ & up" },
];

export default function FilterDrawer() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const sp = useSearchParams();

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams(sp.toString());
    p.delete("page");
    Object.entries(overrides).forEach(([k, v]) => {
      if (v !== undefined && v !== "") p.set(k, v);
      else p.delete(k);
    });
    return `/products?${p.toString()}`;
  }

  function navigate(url: string) {
    router.push(url);
    setOpen(false);
  }

  const category = sp.get("category") ?? "All";
  const zone     = sp.get("zone") ?? "";
  const rating   = sp.get("rating") ?? "";
  const type     = sp.get("type") ?? "";
  const inStock  = sp.get("inStock") ?? "";

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
      >
        <SlidersHorizontal className="w-4 h-4" /> Filters
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={cn(
        "fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-2xl flex flex-col transition-transform duration-300 lg:hidden",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="font-bold text-gray-900">Filters</p>
          <button onClick={() => setOpen(false)}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Product Type */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Product Type</p>
            <div className="flex gap-2">
              {[["", "All"], ["PHYSICAL", "Physical"], ["DIGITAL", "Digital"]].map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => navigate(buildUrl({ type: v || undefined }))}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium border transition-colors",
                    type === v ? "bg-primary-600 text-white border-primary-600" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Category</p>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => navigate(buildUrl({ category: cat === "All" ? undefined : cat }))}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    category === cat || (cat === "All" && category === "All")
                      ? "bg-primary-600 text-white font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Ships To */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Ships To</p>
            <div className="space-y-1">
              <button
                onClick={() => navigate(buildUrl({ zone: undefined }))}
                className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition-colors", !zone ? "bg-primary-600 text-white font-semibold" : "text-gray-700 hover:bg-gray-100")}
              >
                All Regions
              </button>
              {ZONES.map((z) => (
                <button
                  key={z.value}
                  onClick={() => navigate(buildUrl({ zone: z.value }))}
                  className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition-colors", zone === z.value ? "bg-primary-600 text-white font-semibold" : "text-gray-700 hover:bg-gray-100")}
                >
                  {z.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Minimum Rating</p>
            <div className="space-y-1">
              <button
                onClick={() => navigate(buildUrl({ rating: undefined }))}
                className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition-colors", !rating ? "bg-primary-600 text-white font-semibold" : "text-gray-700 hover:bg-gray-100")}
              >
                Any Rating
              </button>
              {RATINGS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => navigate(buildUrl({ rating: r.value }))}
                  className={cn("w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors", rating === r.value ? "bg-primary-600 text-white font-semibold" : "text-gray-700 hover:bg-gray-100")}
                >
                  <Star className={cn("w-3.5 h-3.5", rating === r.value ? "fill-white text-white" : "fill-yellow-400 text-yellow-400")} />
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Price (₦)</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                navigate(buildUrl({
                  minPrice: fd.get("minPrice") as string || undefined,
                  maxPrice: fd.get("maxPrice") as string || undefined,
                }));
              }}
              className="space-y-2"
            >
              <input name="minPrice" type="number" placeholder="Min" defaultValue={sp.get("minPrice") ?? ""} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <input name="maxPrice" type="number" placeholder="Max" defaultValue={sp.get("maxPrice") ?? ""} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <button type="submit" className="w-full py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors">Apply Price</button>
            </form>
          </div>

          {/* In Stock */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Availability</p>
            <button
              onClick={() => navigate(buildUrl({ inStock: inStock ? undefined : "1" }))}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors w-full",
                inStock ? "bg-primary-600 text-white border-primary-600" : "border-gray-200 text-gray-700 hover:bg-gray-50"
              )}
            >
              <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0", inStock ? "bg-white border-white" : "border-gray-400")}>
                {inStock && <div className="w-2 h-2 bg-primary-600 rounded-sm" />}
              </div>
              In Stock Only
            </button>
          </div>
        </div>

        {/* Clear all */}
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={() => navigate("/products")}
            className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      </div>
    </>
  );
}
