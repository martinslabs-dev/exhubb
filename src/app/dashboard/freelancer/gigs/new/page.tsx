"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Plus,
  X,
  Loader2,
  Tag,
  Clock,
  AlignLeft,
  CheckCircle2,
  Star,
  Zap,
  Crown,
  Upload,
  Film,
  Image as ImageIcon,
} from "lucide-react";

import { createGigAction } from "@/lib/actions/gig";

const CATEGORIES = [
  "Design & Creative", "Tech & Dev", "Marketing", "Writing & Translation",
  "Music & Audio", "Video & Animation", "Data & Analytics", "Business",
  "Photography", "Legal", "Finance", "Other",
];

const DELIVERY_DAYS = [1, 2, 3, 5, 7, 10, 14, 21, 30];

export default function NewGigPage() {
  const router  = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [tags,   setTags]   = useState<string[]>([]);
  const [tagInput, setTagInput]   = useState("");
  const [showStandard, setShowStandard] = useState(false);
  const [showPremium,  setShowPremium]  = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Work samples
  const [samples,          setSamples]          = useState<string[]>([]);
  const [samplesUploading, setSamplesUploading] = useState(false);
  const samplesRef = useRef<HTMLInputElement>(null);

  async function handleSampleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = 6 - samples.length;
    if (remaining <= 0) return;
    const toUpload = Array.from(files).slice(0, remaining);
    setSamplesUploading(true);
    const urls: string[] = [];
    for (const file of toUpload) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.url) urls.push(data.url as string);
      } catch {
        // skip failed upload
      }
    }
    setSamples((prev) => [...prev, ...urls]);
    setSamplesUploading(false);
  }

  function addTag(e: React.KeyboardEvent) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim()) && tags.length < 10) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const form = new FormData(e.currentTarget);

    // Inject tags and samples
    form.set("tags",    tags.join(","));
    form.set("samples", samples.join(","));

    const result = await createGigAction(form);
    if (result?.error) {
      setErrors({ submit: result.error });
      setSaving(false);
      return;
    }
    setSaved(true);
    setTimeout(() => router.push("/dashboard/freelancer/gigs"), 1200);
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-3xl mx-auto">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="mb-6">
        <Link
          href="/dashboard/freelancer/gigs"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Gigs
        </Link>
        <h1 className="text-2xl font-black text-gray-900">Create New Gig</h1>
        <p className="text-sm text-gray-500 mt-0.5">Describe your service and set your prices.</p>
      </div>

      {saved && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-green-700">Gig created! Redirecting…</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Overview ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Gig Overview</h2>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Gig Title *</span>
            </label>
            <input
              name="title"
              placeholder="e.g. I will design a professional logo for your brand"
              className={`w-full h-11 px-3.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-primary-100 ${errors.title ? "border-red-300" : "border-gray-200 focus:border-primary-400"}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            <p className="text-xs text-gray-400 mt-1">Start with "I will…" for best results.</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5"><AlignLeft className="w-3.5 h-3.5" /> Description</span>
            </label>
            <textarea
              name="description"
              rows={5}
              placeholder="Describe your service in detail — what you'll deliver, your process, and what makes you unique…"
              className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all resize-none"
            />
          </div>

          {/* Category + Delivery */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Category *</span>
              </label>
              <select
                name="category"
                defaultValue=""
                className={`w-full h-11 px-3.5 rounded-xl border text-sm outline-none transition-all bg-white focus:ring-2 focus:ring-primary-100 ${errors.category ? "border-red-300" : "border-gray-200 focus:border-primary-400"}`}
              >
                <option value="" disabled>Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Delivery Time *</span>
              </label>
              <select
                name="deliveryDays"
                defaultValue=""
                className={`w-full h-11 px-3.5 rounded-xl border text-sm outline-none transition-all bg-white focus:ring-2 focus:ring-primary-100 ${errors.delivery ? "border-red-300" : "border-gray-200 focus:border-primary-400"}`}
              >
                <option value="" disabled>Select days</option>
                {DELIVERY_DAYS.map((d) => (
                  <option key={d} value={d}>{d} day{d !== 1 ? "s" : ""}</option>
                ))}
              </select>
              {errors.delivery && <p className="text-xs text-red-500 mt-1">{errors.delivery}</p>}
            </div>
          </div>
        </div>

        {/* ── Pricing Tiers ───────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Pricing</h2>

          {/* Basic */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-primary-600" />
              </div>
              <p className="text-sm font-black text-gray-900">Basic</p>
              <span className="text-xs text-gray-400">Required</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Price (USD) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    name="basicPrice"
                    type="number" min="5" step="1" placeholder="5"
                    className={`w-full h-10 pl-7 pr-3 rounded-lg border text-sm outline-none transition-all focus:ring-2 focus:ring-primary-100 bg-white ${errors.price ? "border-red-300" : "border-gray-200 focus:border-primary-400"}`}
                  />
                </div>
                {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">What's included</label>
                <input
                  name="basicDescription"
                  placeholder="Brief description…"
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Standard */}
          {showStandard ? (
            <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 relative">
              <button
                type="button"
                onClick={() => setShowStandard(false)}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Star className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <p className="text-sm font-black text-gray-900">Standard</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Price (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input name="standardPrice" type="number" min="5" step="1" placeholder="25"
                      className="w-full h-10 pl-7 pr-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">What's included</label>
                  <input name="standardDescription" placeholder="Brief description…"
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white transition-all"
                  />
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowStandard(true)}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-dashed border-gray-200 hover:border-amber-300 hover:bg-amber-50/30 text-sm font-semibold text-gray-400 hover:text-amber-600 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Standard Package
            </button>
          )}

          {/* Premium */}
          {showPremium ? (
            <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4 relative">
              <button
                type="button"
                onClick={() => setShowPremium(false)}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Crown className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <p className="text-sm font-black text-gray-900">Premium</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Price (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input name="premiumPrice" type="number" min="5" step="1" placeholder="75"
                      className="w-full h-10 pl-7 pr-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">What's included</label>
                  <input name="premiumDescription" placeholder="Brief description…"
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white transition-all"
                  />
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowPremium(true)}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 text-sm font-semibold text-gray-400 hover:text-purple-600 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Premium Package
            </button>
          )}
        </div>

        {/* ── Tags ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Search Tags</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full">
                {tag}
                <button type="button" onClick={() => removeTag(tag)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={addTag}
            placeholder="e.g. logo design, branding, illustration…"
            className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
          />
          <p className="text-xs text-gray-400 mt-2">Up to 10 tags. Press Enter or comma to add.</p>
        </div>

        {/* ── Work Samples ────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Work Samples</h2>
          <p className="text-xs text-gray-400 mb-4">Upload up to 6 images or short videos that showcase your work. These appear on your gig listing.</p>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
            {samples.map((url, i) => {
              const vid = /\.(mp4|webm|mov)$/i.test(url);
              return (
                <div key={url} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                  {vid ? (
                    <video src={url} muted className="w-full h-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={`Sample ${i + 1}`} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-1 left-1">
                    {vid
                      ? <Film className="w-3 h-3 text-white drop-shadow" />
                      : <ImageIcon className="w-3 h-3 text-white drop-shadow" />}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSamples((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              );
            })}

            {samples.length < 6 && (
              <button
                type="button"
                onClick={() => samplesRef.current?.click()}
                disabled={samplesUploading}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-primary-400 hover:bg-primary-50/30 flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50"
              >
                {samplesUploading
                  ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  : <Upload className="w-4 h-4 text-gray-400" />}
                <span className="text-[10px] text-gray-400 font-semibold">{samples.length === 0 ? "Add" : "+"}</span>
              </button>
            )}
          </div>

          <input
            ref={samplesRef}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            multiple
            className="hidden"
            onChange={(e) => handleSampleFiles(e.target.files)}
          />
          <p className="text-xs text-gray-400">Images (JPG/PNG/WebP) or short videos (MP4/WebM/MOV). Max 5 MB per image, 50 MB per video.</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Visibility</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">Publish gig immediately</p>
              <p className="text-xs text-gray-400 mt-0.5">Make this gig visible and bookable right away.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input name="isActive" type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
            </label>
          </div>
        </div>

        {/* ── Submit ──────────────────────────────────────── */}
        {errors.submit && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            <X className="w-4 h-4 flex-shrink-0" /> {errors.submit}
          </div>
        )}
        <div className="flex items-center gap-3 pb-6">
          <button
            type="submit"
            disabled={saving || saved}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-bold transition-colors"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : saved
              ? <><CheckCircle2 className="w-4 h-4" /> Saved!</>
              : <><Plus className="w-4 h-4" /> Publish Gig</>
            }
          </button>
          <Link
            href="/dashboard/freelancer/gigs"
            className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
