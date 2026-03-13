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
import TAXONOMY from "@/lib/taxonomy.json";
import CATEGORIES_MENU from "@/../taxonomy-migration/categories_menu.json";

const servicesMenu = TAXONOMY.menu.find((m: any) => m.title === "Services" || m.slug === "services") || CATEGORIES_MENU.menu.find((m: any) => m.title === "Services" || m.slug === "services") || { columns: [] };
const SERVICES_ITEMS = servicesMenu.columns.flatMap((c: any) => (c.items || []).map((it: any) => ({ title: it.title, slug: it.slug, children: it.children || [] })));

const DELIVERY_DAYS = [1, 2, 3, 5, 7, 10, 14, 21, 30];

interface Gig {
  id: string;
  title: string;
  description: string | null;
  category: string;
  subcategory?: string | null;
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
  const [titleWords, setTitleWords] = useState<number>((gig.title || "").trim().split(/\s+/).filter(Boolean).length);
  const [descWords, setDescWords] = useState<number>((gig.description || "").trim().split(/\s+/).filter(Boolean).length);

  const [tags,     setTags]     = useState<string[]>(gig.tags);
  const [tagInput, setTagInput] = useState("");

  const [showStandard, setShowStandard] = useState(!!gig.standardPrice);
  const [showPremium,  setShowPremium]  = useState(!!gig.premiumPrice);
  const [category, setCategory] = useState<string | undefined>(gig.category ?? undefined);
  const [subcategory, setSubcategory] = useState<string | undefined>(gig.subcategory ?? undefined);
  const [coverImage, setCoverImage] = useState<string | null>(gig.coverImage ?? null);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [coverMeta, setCoverMeta] = useState<{ name: string; size: number; width?: number; height?: number } | null>(null);

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
        const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "same-origin" });
        const data = await res.json();
        if (!res.ok) {
          console.error("sample upload failed", data);
          continue;
        }
        if (data.url) urls.push(data.url as string);
      } catch (err) {
        console.error("sample upload error", err);
        // skip failed upload
      }
    }
    setSamples((prev) => [...prev, ...urls]);
    setSamplesUploading(false);
  }

  async function handleCoverFile(file: File | null) {
    if (!file) return;
    // client-side validation
    const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
    const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setErrors((p) => ({ ...p, cover: "Unsupported file type. Use JPG, PNG, WebP, GIF or AVIF." }));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrors((p) => ({ ...p, cover: `File too large. Max ${MAX_IMAGE_BYTES / 1024 / 1024} MB.` }));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    try {
      const img = new Image();
      const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => reject(new Error("Failed to read image"));
        img.src = objectUrl;
      });
      setCoverMeta({ name: file.name, size: file.size, width: dims.w, height: dims.h });
    } catch (e) {
      setCoverMeta({ name: file.name, size: file.size });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }

    setErrors((p) => { const c = { ...p }; delete c.cover; return c; });
    setCoverUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok) {
        console.error("cover upload failed", data);
        setErrors((prev) => ({ ...prev, cover: data?.error ?? "Upload failed" }));
      } else if (data.url) {
        setCoverImage(data.url as string);
      }
    } catch (err) {
      console.error("cover upload error", err);
      setErrors((prev) => ({ ...prev, cover: "Upload failed" }));
    } finally {
      setCoverUploading(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDropCover(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0] ?? null;
    handleCoverFile(f);
  }

  function handleDropSamples(e: React.DragEvent) {
    e.preventDefault();
    handleSampleFiles(e.dataTransfer?.files ?? null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const form = new FormData(e.currentTarget);
    form.set("tags",    tags.join(","));
    form.set("samples", samples.join(","));

    const countWords = (s?: string | null) => (s ? s.trim().split(/\s+/).filter(Boolean).length : 0);
    const titleVal = form.get("title") as string;
    const descVal = form.get("description") as string;
    if (countWords(titleVal) > 80) {
      setErrors({ submit: "Title exceeds 80 words" });
      setSaving(false);
      return;
    }
    if (countWords(descVal) > 1200) {
      setErrors({ submit: "Description exceeds 1200 words" });
      setSaving(false);
      return;
    }

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
              onChange={(e) => setTitleWords(e.currentTarget.value.trim().split(/\s+/).filter(Boolean).length)}
              className={`w-full h-11 px-3.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-primary-100 ${errors.title ? "border-red-300" : "border-gray-200 focus:border-primary-400"}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            <p className={`text-xs mt-1 ${titleWords > 80 ? 'text-red-500' : 'text-gray-400'}`}>{titleWords} / 80 words</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5"><AlignLeft className="w-3.5 h-3.5" /> Description</span>
            </label>
            <textarea
              name="description"
              rows={5}
              defaultValue={gig.description ?? ""}
              onChange={(e) => setDescWords(e.currentTarget.value.trim().split(/\s+/).filter(Boolean).length)}
              className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all resize-none"
            />
            <p className={`text-xs mt-1 ${descWords > 1200 ? 'text-red-500' : 'text-gray-400'}`}>{descWords} / 1200 words</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Category *</span>
              </label>
              <div>
                <select
                  name="category"
                  value={category ?? ""}
                  onChange={(e) => { setCategory(e.target.value || undefined); setSubcategory(undefined); }}
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm outline-none transition-all bg-white focus:ring-2 focus:ring-primary-100 focus:border-primary-400"
                >
                  <option value="" disabled>Select category</option>
                  {SERVICES_ITEMS.map((c) => <option key={c.slug} value={c.title}>{c.title}</option>)}
                </select>
                {(() => {
                  const sel = SERVICES_ITEMS.find((d: any) => d.title === category);
                  if (sel && sel.children && sel.children.length) {
                    return (
                      <select name="subcategory" value={subcategory ?? ""} onChange={(e) => setSubcategory(e.target.value || undefined)} className="w-full mt-2 h-11 px-3.5 rounded-xl border border-gray-200 text-sm outline-none">
                        <option value="">Select a subcategory (optional)</option>
                        {sel.children.map((ch: any) => <option key={ch.slug} value={ch.title}>{ch.title}</option>)}
                      </select>
                    );
                  }
                  return null;
                })()}
                <div className="mt-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cover image (thumbnail)</label>
                  <div className="mt-2">
                    <div
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); coverInputRef.current?.click(); } }}
                      onClick={() => coverInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDrop={handleDropCover}
                      className="group relative border-2 border-dashed rounded-xl p-3 flex items-center gap-4 hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 cursor-pointer"
                    >
                      <div className="w-28 h-16 bg-gray-50 rounded-md overflow-hidden flex items-center justify-center border">
                        {coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center text-gray-400">
                            <ImageIcon className="w-6 h-6" />
                            <span className="text-xs mt-1">Drop image or click</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <button type="button" disabled={coverUploading} onClick={() => coverInputRef.current?.click()} className="text-sm px-3 py-1 bg-white border rounded-md">Choose file</button>
                          <div className="text-sm text-gray-600 truncate">This image appears on listing cards</div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Recommended: 640×360 • JPG/PNG/WebP • Max 5 MB</p>
                        {coverMeta && (
                          <div className="mt-2 text-xs text-gray-600">
                            <div className="truncate">{coverMeta.name} • {Math.round(coverMeta.size / 1024)} KB</div>
                            {coverMeta.width && coverMeta.height && (
                              <div>{coverMeta.width}×{coverMeta.height} ({Math.round((coverMeta.width/coverMeta.height)*100)/100}:1)</div>
                            )}
                          </div>
                        )}
                        {errors.cover && <p className="text-xs text-red-500 mt-1" aria-live="polite">{errors.cover}</p>}
                      </div>

                      {coverUploading && <div className="absolute right-3 top-3"><Loader2 className="w-5 h-5 animate-spin text-primary-600" /></div>}

                      {coverImage && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setCoverImage(null); setErrors((p) => { const c = { ...p }; delete c.cover; return c; }); }}
                          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
                          aria-label="Remove cover image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}

                      <input ref={coverInputRef} type="file" accept="image/*" className="sr-only" onChange={(e) => handleCoverFile(e.target.files?.[0] ?? null)} />
                    </div>
                    {coverImage && <input type="hidden" name="coverImage" value={coverImage} />}
                  </div>
                </div>
              </div>
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
          <div onDragOver={handleDragOver} onDrop={handleDropSamples} className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
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
