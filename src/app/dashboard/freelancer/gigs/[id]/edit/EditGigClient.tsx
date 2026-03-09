"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
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
  Briefcase,
} from "lucide-react";
import { updateGigAction } from "@/lib/actions/gig";

const CATEGORIES = [
  "Design & Creative", "Tech & Dev", "Marketing", "Writing & Translation",
  "Music & Audio", "Video & Animation", "Data & Analytics", "Business",
  "Photography", "Legal", "Finance", "Other",
];

const DELIVERY_DAYS = [1, 2, 3, 5, 7, 10, 14, 21, 30];

interface Gig {
  id: string;
  title: string;
  description: string | null;
  category: string;
  deliveryDays: number;
  basicPrice: number;
  standardPrice: number | null;
  premiumPrice: number | null;
  tags: string[];
  samples: string[];
  isActive: boolean;
}

export default function EditGigClient({ gig }: { gig: Gig }) {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [tags,     setTags]     = useState<string[]>(gig.tags);
  const [tagInput, setTagInput] = useState("");

  const [showStandard, setShowStandard] = useState(!!gig.standardPrice);
  const [showPremium,  setShowPremium]  = useState(!!gig.premiumPrice);

  const [samples,          setSamples]          = useState<string[]>(gig.samples);
  const [samplesUploading, setSamplesUploading] = useState(false);
  const samplesRef = useRef<HTMLInputElement>(null);

  function addTag(e: React.KeyboardEvent) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim()) && tags.length < 10) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  }

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const form = new FormData(e.currentTarget);
    form.set("tags",    tags.join(","));
    form.set("samples", samples.join(","));

    const result = await updateGigAction(gig.id, form);
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
      <div className="mb-6">
        <Link
          href="/dashboard/freelancer/gigs"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Gigs
        </Link>
        <h1 className="text-2xl font-black text-gray-900">Edit Gig</h1>
        <p className="text-sm text-gray-500 mt-0.5">Update your service details and pricing.</p>
      </div>

      {saved && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-green-700">Changes saved! Redirecting…</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Overview ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Gig Overview</h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Gig Title *</span>
            </label>
            <input
              name="title"
              defaultValue={gig.title}
              className={`w-full h-11 px-3.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-primary-100 ${errors.title ? "border-red-300" : "border-gray-200 focus:border-primary-400"}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5"><AlignLeft className="w-3.5 h-3.5" /> Description</span>
            </label>
            <textarea
              name="description"
              rows={5}
              defaultValue={gig.description ?? ""}
              className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Category *</span>
              </label>
              <select
                name="category"
                defaultValue={gig.category}
                className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm outline-none transition-all bg-white focus:ring-2 focus:ring-primary-100 focus:border-primary-400"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Delivery Time *</span>
              </label>
              <select
                name="deliveryDays"
                defaultValue={gig.deliveryDays}
                className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm outline-none transition-all bg-white focus:ring-2 focus:ring-primary-100 focus:border-primary-400"
              >
                {DELIVERY_DAYS.map((d) => (
                  <option key={d} value={d}>{d} day{d !== 1 ? "s" : ""}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Pricing ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Pricing</h2>

          {/* Basic */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-primary-600" />
              </div>
              <p className="text-sm font-black text-gray-900">Basic</p>
            </div>
            <div className="relative w-48">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                name="basicPrice"
                type="number" min="1" step="1"
                defaultValue={gig.basicPrice}
                className="w-full h-10 pl-7 pr-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white"
              />
            </div>
          </div>

          {/* Standard */}
          {showStandard ? (
            <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 relative">
              <button type="button" onClick={() => setShowStandard(false)}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                <X className="w-3 h-3 text-gray-400" />
              </button>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Star className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <p className="text-sm font-black text-gray-900">Standard</p>
              </div>
              <div className="relative w-48">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input name="standardPrice" type="number" min="1" step="1"
                  defaultValue={gig.standardPrice ?? ""}
                  className="w-full h-10 pl-7 pr-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white" />
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setShowStandard(true)}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-dashed border-gray-200 hover:border-amber-300 hover:bg-amber-50/30 text-sm font-semibold text-gray-400 hover:text-amber-600 transition-all">
              <Plus className="w-4 h-4" /> Add Standard Package
            </button>
          )}

          {/* Premium */}
          {showPremium ? (
            <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4 relative">
              <button type="button" onClick={() => setShowPremium(false)}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                <X className="w-3 h-3 text-gray-400" />
              </button>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Crown className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <p className="text-sm font-black text-gray-900">Premium</p>
              </div>
              <div className="relative w-48">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input name="premiumPrice" type="number" min="1" step="1"
                  defaultValue={gig.premiumPrice ?? ""}
                  className="w-full h-10 pl-7 pr-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white" />
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setShowPremium(true)}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 text-sm font-semibold text-gray-400 hover:text-purple-600 transition-all">
              <Plus className="w-4 h-4" /> Add Premium Package
            </button>
          )}
        </div>

        {/* ── Tags ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Search Tags</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full">
                {tag}
                <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={addTag}
            placeholder="e.g. logo design, branding…"
            className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
          />
          <p className="text-xs text-gray-400 mt-2">Up to 10 tags. Press Enter or comma to add.</p>
        </div>

        {/* ── Work Samples ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Work Samples</h2>
          <p className="text-xs text-gray-400 mb-4">Upload up to 6 images or short videos that showcase your work.</p>
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
                    {vid ? <Film className="w-3 h-3 text-white drop-shadow" /> : <ImageIcon className="w-3 h-3 text-white drop-shadow" />}
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
                {samplesUploading ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" /> : <Upload className="w-4 h-4 text-gray-400" />}
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
        </div>

        {/* ── Visibility ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Visibility</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">Gig is active</p>
              <p className="text-xs text-gray-400 mt-0.5">Toggle to show or hide this gig.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input name="isActive" type="checkbox" defaultChecked={gig.isActive} className="sr-only peer" />
              <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
            </label>
          </div>
        </div>

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
              : "Save Changes"
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
