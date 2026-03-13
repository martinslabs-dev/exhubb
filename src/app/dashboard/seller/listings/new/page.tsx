"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Upload,
  Plus,
  X,
  Loader2,
  DollarSign,
  Tag,
  Hash,
  AlignLeft,
  CheckCircle2,
  Truck,
  Globe,
  MapPin,
  BookOpen,
  FileDown,
  PlayCircle,
  ImagePlay,
  Headphones,
  FileText,
  Download,
  Zap,
} from "lucide-react";
import { createListingAction, updateListingAction } from "@/lib/actions/listings";

import TAXONOMY from "@/lib/taxonomy.json";

// derive category lists from taxonomy.json
const physicalMenu = TAXONOMY.menu.find((m: any) => m.title === "Physical Products") || { columns: [] };
const digitalMenu = TAXONOMY.menu.find((m: any) => m.title === "Digital Products") || { columns: [] };

const PHYSICAL_ITEMS = physicalMenu.columns.flatMap((col: any) => col.items.map((it: any) => ({ title: it.title, slug: it.slug, children: it.children || [] })));
const DIGITAL_ITEMS  = digitalMenu.columns.flatMap((col: any) => col.items.map((it: any) => ({ title: it.title, slug: it.slug, children: it.children || [] })));

const DIGITAL_SUB_TYPES = [
  { value: "ebook",    label: "eBook / Document",   icon: BookOpen   },
  { value: "software", label: "Software / File",    icon: FileDown   },
  { value: "course",   label: "Online Course",      icon: PlayCircle },
  { value: "art",      label: "Digital Art",        icon: ImagePlay  },
  { value: "music",    label: "Music / Audio",      icon: Headphones },
  { value: "template", label: "Template / Document", icon: FileText  },
];

const SHIPPING_ZONES = [
  { value: "NIGERIA",       label: "🇳🇬 Nigeria",       desc: "Ships within Nigeria" },
  { value: "AFRICA",        label: "🌍 Africa",         desc: "Ships to African countries" },
  { value: "INTERNATIONAL", label: "🌐 International",  desc: "Ships worldwide" },
];

export default function NewListingPage() {
  const router  = useRouter();
  const search  = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [tags,   setTags]   = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedZones, setSelectedZones] = useState<string[]>(["NIGERIA"]);
  const [unlimitedStock, setUnlimitedStock] = useState(false);
  const [shipsFromCity, setShipsFromCity] = useState<string | undefined>(undefined);
  const [weightVal, setWeightVal] = useState<number | undefined>(undefined);
  const [nigeriaFeeVal, setNigeriaFeeVal] = useState<number | undefined>(undefined);
  const [africaFeeVal, setAfricaFeeVal] = useState<number | undefined>(undefined);
  const [internationalFeeVal, setInternationalFeeVal] = useState<number | undefined>(undefined);
  const [variants, setVariants] = useState<{ name: string; value: string; price?: number | null; stock: number; sku?: string | null }[]>([]);
  // Basic form fields for edit prefill
  const [title, setTitle] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [subcategory, setSubcategory] = useState<string | undefined>(undefined);
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [compareAtPrice, setCompareAtPrice] = useState<number | undefined>(undefined);
  const [stock, setStock] = useState<number | undefined>(undefined);
  // Variants state (see above)
  const [variantGroupName, setVariantGroupName] = useState("");
  // Digital product state
  const [productType, setProductType] = useState<"PHYSICAL" | "DIGITAL">("PHYSICAL");
  const [digitalFiles, setDigitalFiles] = useState<{ url: string; name: string }[]>([]);
  const [uploadingDigital, setUploadingDigital] = useState(false);
  const [digitalSubType, setDigitalSubType] = useState("ebook");
  const [editingId, setEditingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const digitalFileInputRef = useRef<HTMLInputElement>(null);

  async function handleImageFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = 8 - images.length;
    const toProcess = Array.from(files).slice(0, remaining);
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of toProcess) {
      if (!file.type.startsWith("image/")) continue;
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (res.ok) {
          const { url } = await res.json() as { url: string };
          newUrls.push(url);
        }
      } catch {
        // silently skip failed individual uploads
      }
    }
    setImages((prev) => [...prev, ...newUrls]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // If ?edit=<id> is present, fetch product and prefill form state
  useEffect(() => {
    const editId = search?.get("edit");
    if (!editId) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/listings/${editId}`);
        if (!res.ok) return;
        const { product } = await res.json();
        if (!mounted || !product) return;
        setEditingId(product.id);
        setImages(product.images || []);
        setTags(product.tags || []);
        setProductType(product.productType || "PHYSICAL");
        setUnlimitedStock(product.unlimitedStock ?? false);
        setDigitalFiles((product.digitalFiles || []).map((u: string, i: number) => ({ url: u, name: product.digitalFileNames?.[i] ?? `file-${i}` })));
        // Shipping and fees
        setSelectedZones(product.shippingZones ?? []);
        setShipsFromCity(product.shipsFromCity ?? undefined);
        setWeightVal(product.weight ?? undefined);
        setNigeriaFeeVal(product.nigeriaFee ?? undefined);
        setAfricaFeeVal(product.africaFee ?? undefined);
        setInternationalFeeVal(product.internationalFee ?? undefined);
        // Variants (if included)
        setVariants((product.variants || []).map((v: any) => ({ name: v.name ?? "", value: v.value ?? "", price: v.price ?? null, stock: v.stock ?? 0, sku: v.sku ?? null })));
        // Prefill basic fields so the visible form shows the product values
        setTitle(product.title ?? undefined);
        setDescription(product.description ?? undefined);
        // Try to preserve parent/category and subcategory if present in product
        if (product.subcategory) {
          setCategory(product.category ?? undefined);
          setSubcategory(product.subcategory ?? undefined);
        } else if (product.category) {
          // attempt to find if the stored category matches a known child and split
          let found = false;
          for (const it of PHYSICAL_ITEMS) {
            if ((it.children || []).some((c: any) => c.title === product.category)) {
              setCategory(it.title);
              setSubcategory(product.category);
              found = true;
              break;
            }
          }
          if (!found) {
            for (const it of DIGITAL_ITEMS) {
              if ((it.children || []).some((c: any) => c.title === product.category)) {
                setCategory(it.title);
                setSubcategory(product.category);
                found = true;
                break;
              }
            }
          }
          if (!found) {
            setCategory(product.category);
            setSubcategory(undefined);
          }
        } else {
          setCategory(undefined);
          setSubcategory(undefined);
        }
        setPrice(product.price ?? undefined);
        setCompareAtPrice(product.compareAtPrice ?? undefined);
        setStock(product.stock ?? undefined);
        // set basic fields by setting hidden inputs when submitting (title/price/etc use form values)
        // For UX, we can set errors to empty and focus later.
      } catch (err) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDigitalFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadingDigital(true);
    for (const file of Array.from(files).slice(0, 10 - digitalFiles.length)) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (res.ok) {
          const { url } = await res.json() as { url: string };
          setDigitalFiles((prev) => [...prev, { url, name: file.name }]);
        }
      } catch { /* skip */ }
    }
    setUploadingDigital(false);
    if (digitalFileInputRef.current) digitalFileInputRef.current.value = "";
  }

  function toggleZone(zone: string) {
    setSelectedZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
    );
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
    const form = new FormData(e.currentTarget);

    const newErrors: Record<string, string> = {};
    if (!form.get("title"))    newErrors.title    = "Title is required";
    if (!form.get("price"))    newErrors.price    = "Price is required";
    if (!form.get("category")) newErrors.category = "Category is required";
    if (productType === "PHYSICAL" && !unlimitedStock && !form.get("stock")) {
      newErrors.stock = "Stock quantity is required";
    }
    if (productType === "DIGITAL" && digitalFiles.length === 0) {
      newErrors.digitalFiles = "Please upload at least one digital file";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSaving(false);
      return;
    }

    images.forEach((img) => form.append("images", img));
    tags.forEach((tag) => form.append("tags", tag));
    form.append("productType", productType);
    digitalFiles.forEach((f) => {
      form.append("digitalFiles", f.url);
      form.append("digitalFileNames", f.name);
    });
    if (variants.length > 0) form.append("variants", JSON.stringify(variants));

    let result: any;
    if (editingId) {
      result = await updateListingAction(editingId, form);
    } else {
      result = await createListingAction(form);
    }
    if (result?.error) {
      setErrors({ submit: result.error });
      setSaving(false);
      return;
    }
    setSaved(true);
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-3xl mx-auto">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="mb-6">
        <Link
          href="/dashboard/seller/listings"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Listings
        </Link>
        <h1 className="text-2xl font-black text-gray-900">Create New Listing</h1>
        <p className="text-sm text-gray-500 mt-0.5">Fill in the details to list your product on Exhubb.</p>
      </div>

      {saved && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-green-700">Listing created! Redirecting…</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Product Type ────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Product Type</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setProductType("PHYSICAL")}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 text-left transition-all ${productType === "PHYSICAL" ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"}`}
            >
              <Package className={`w-7 h-7 ${productType === "PHYSICAL" ? "text-primary-600" : "text-gray-400"}`} />
              <div>
                <p className={`text-sm font-bold ${productType === "PHYSICAL" ? "text-primary-700" : "text-gray-700"}`}>Physical Product</p>
                <p className="text-xs text-gray-400 mt-0.5">Requires shipping to buyer</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => { setProductType("DIGITAL"); setUnlimitedStock(true); }}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 text-left transition-all ${productType === "DIGITAL" ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}
            >
              <Zap className={`w-7 h-7 ${productType === "DIGITAL" ? "text-indigo-600" : "text-gray-400"}`} />
              <div>
                <p className={`text-sm font-bold ${productType === "DIGITAL" ? "text-indigo-700" : "text-gray-700"}`}>Digital Product</p>
                <p className="text-xs text-gray-400 mt-0.5">Instant delivery · eBook, course, file…</p>
              </div>
            </button>
          </div>
          <input type="hidden" name="productType" value={productType} />
        </div>

        {/* ── Cover Image ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
            {productType === "DIGITAL" ? "Cover Image" : "Product Images"}
          </h2>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={productType === "PHYSICAL"}
            className="hidden"
            onChange={(e) => handleImageFiles(e.target.files)}
          />
          <div
            className="grid grid-cols-4 gap-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleImageFiles(e.dataTransfer.files); }}
          >
            {images.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages(images.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 text-[10px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded">
                    {productType === "DIGITAL" ? "Cover" : "Main"}
                  </span>
                )}
              </div>
            ))}
            {images.length < (productType === "DIGITAL" ? 1 : 8) && (
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-primary-400 hover:bg-primary-50 flex flex-col items-center justify-center gap-1 transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uploading
                  ? <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
                  : <Upload className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
                }
                <span className="text-xs text-gray-400 group-hover:text-primary-500 transition-colors">
                  {uploading ? "Uploading…" : "Add"}
                </span>
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            {productType === "DIGITAL"
              ? "1 cover image · shown on product listing page."
              : "Up to 8 images · drag & drop or click Add · first image is the main thumbnail."}
          </p>
        </div>

        {/* ── Digital Files Upload (digital only) ─────────── */}
        {productType === "DIGITAL" && (
          <div className="bg-white rounded-2xl border border-indigo-100 p-5">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Digital Files *</h2>
            <p className="text-xs text-gray-400 mb-4">Upload the files buyers will download after purchase. PDFs, ZIPs, MP4s, etc.</p>

            {/* Sub-type selector */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Digital Product Type</label>
              <div className="grid grid-cols-3 gap-2">
                {DIGITAL_SUB_TYPES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setDigitalSubType(t.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${digitalSubType === t.value ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <input type="hidden" name="digitalSubType" value={digitalSubType} />
            </div>

            <input
              ref={digitalFileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.zip,.rar,.mp4,.mp3,.epub,.docx,.pptx,.xlsx,.png,.jpg,.psd,.ai,.fig,.sketch"
              onChange={(e) => handleDigitalFiles(e.target.files)}
            />

            {/* File list */}
            {digitalFiles.length > 0 && (
              <div className="space-y-2 mb-3">
                {digitalFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-indigo-50 rounded-xl">
                    <Download className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium flex-1 truncate">{f.name}</span>
                    <button type="button" onClick={() => setDigitalFiles((prev) => prev.filter((_, j) => j !== i))}>
                      <X className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {digitalFiles.length < 10 && (
              <button
                type="button"
                disabled={uploadingDigital}
                onClick={() => digitalFileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-sm font-semibold text-indigo-600 transition-all disabled:opacity-60"
              >
                {uploadingDigital ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploadingDigital ? "Uploading…" : "Upload Files"}
              </button>
            )}
            {errors.digitalFiles && <p className="text-xs text-red-500 mt-2">{errors.digitalFiles}</p>}
          </div>
        )}

        {/* ── Basic Info ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
            Basic Information
          </h2>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> {productType === "DIGITAL" ? "Product Title *" : "Product Title *"}</span>
            </label>
            <input
              name="title"
              defaultValue={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={productType === "DIGITAL" ? "e.g. Complete React Course for Beginners" : "e.g. Premium Wireless Noise-Cancelling Headphones"}
              className={`w-full h-11 px-3.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-primary-100 ${errors.title ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-primary-400"}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5"><AlignLeft className="w-3.5 h-3.5" /> Description</span>
            </label>
            <textarea
              name="description"
              defaultValue={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder={productType === "DIGITAL"
                ? "Describe what's included, who it's for, and what buyers will learn or gain…"
                : "Describe your product — features, condition, what's included…"}
              className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Category *</span>
            </label>
            {productType === "DIGITAL" ? (
              <>
                <select
                  name="category"
                  defaultValue={category ?? ""}
                  onChange={(e) => { setCategory(e.target.value); setSubcategory(undefined); }}
                  className={`w-full h-11 px-3.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-primary-100 bg-white ${errors.category ? "border-red-300" : "border-gray-200 focus:border-primary-400"}`}
                >
                  <option value="" disabled>Select a digital category</option>
                  {DIGITAL_ITEMS.map((c: any) => <option key={c.slug} value={c.title}>{c.title}</option>)}
                </select>
                {(() => {
                  const sel = DIGITAL_ITEMS.find((d: any) => d.title === category);
                  if (sel && sel.children && sel.children.length) {
                    return (
                      <select name="subcategory" defaultValue={subcategory ?? ""} onChange={(e) => setSubcategory(e.target.value)} className="w-full mt-2 h-11 px-3.5 rounded-xl border border-gray-200 text-sm outline-none">
                        <option value="" disabled>Select a subcategory</option>
                        {sel.children.map((ch: any) => <option key={ch.slug} value={ch.title}>{ch.title}</option>)}
                      </select>
                    );
                  }
                  return null;
                })()}
              </>
            ) : null}
            {productType === "PHYSICAL" ? (
                <>
                  <select
                    name="category"
                    defaultValue={category ?? ""}
                    onChange={(e) => { setCategory(e.target.value); setSubcategory(undefined); }}
                    className={`w-full h-11 px-3.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-primary-100 bg-white ${errors.category ? "border-red-300" : "border-gray-200 focus:border-primary-400"}`}
                  >
                    <option value="" disabled>Select a category</option>
                    {PHYSICAL_ITEMS.map((c: any) => <option key={c.slug} value={c.title}>{c.title}</option>)}
                  </select>
                  {(() => {
                    const sel = PHYSICAL_ITEMS.find((d: any) => d.title === category);
                    if (sel && sel.children && sel.children.length) {
                      return (
                        <select name="subcategory" defaultValue={subcategory ?? ""} onChange={(e) => setSubcategory(e.target.value)} className="w-full mt-2 h-11 px-3.5 rounded-xl border border-gray-200 text-sm outline-none">
                          <option value="" disabled>Select a subcategory</option>
                          {sel.children.map((ch: any) => <option key={ch.slug} value={ch.title}>{ch.title}</option>)}
                        </select>
                      );
                    }
                    return null;
                  })()}
                </>
            ) : (
              <div className="flex items-center gap-2 h-11 px-3.5 rounded-xl border border-indigo-200 bg-indigo-50 text-sm text-indigo-700 font-semibold">
                <Zap className="w-4 h-4" /> Digital Products
              </div>
            )}
            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
          </div>
        </div>

        {/* ── Pricing & Stock ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
            Pricing & Stock
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Price (₦) *</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
                <input
                  name="price"
                  type="number"
                  defaultValue={price ?? undefined}
                  onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : undefined)}
                  min="0"
                  step="1"
                  placeholder="0"
                  className={`w-full h-11 pl-7 pr-3.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-primary-100 ${errors.price ? "border-red-300" : "border-gray-200 focus:border-primary-400"}`}
                />
              </div>
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
                <input
                  name="compareAtPrice"
                  type="number"
                  defaultValue={compareAtPrice ?? undefined}
                  onChange={(e) => setCompareAtPrice(e.target.value ? Number(e.target.value) : undefined)}
                  min="0"
                  step="1"
                  placeholder="Original price (shows as crossed out)"
                  className="w-full h-11 pl-7 pr-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Leave blank if no discount</p>
            </div>
          </div>

          {/* Stock — hidden for digital (always unlimited) */}
          {productType === "PHYSICAL" && (
            <div className="grid grid-cols-2 gap-4">
              <div className={unlimitedStock ? "opacity-40 pointer-events-none" : ""}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> Stock Quantity *</span>
                </label>
                <input
                  name="stock"
                  type="number"
                  min="0"
                  placeholder="1"
                  defaultValue={unlimitedStock ? "" : (stock ?? undefined)}
                  onChange={(e) => setStock(e.target.value ? Number(e.target.value) : undefined)}
                  className={`w-full h-11 px-3.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-primary-100 ${errors.stock ? "border-red-300" : "border-gray-200 focus:border-primary-400"}`}
                />
                {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock}</p>}
              </div>
              <div className="flex items-center gap-3 pt-6">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    name="unlimitedStock"
                    type="checkbox"
                    checked={unlimitedStock}
                    onChange={(e) => setUnlimitedStock(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
                </label>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Unlimited Stock</p>
                  <p className="text-xs text-gray-400">No stock limit</p>
                </div>
              </div>
            </div>
          )}

          {/* Digital: show unlimited notice */}
          {productType === "DIGITAL" && (
            <>
              <input type="hidden" name="unlimitedStock" value="on" />
              <input type="hidden" name="stock" value="999999" />
              <div className="flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2.5">
                <Zap className="w-3.5 h-3.5 flex-shrink-0" />
                Digital products have unlimited stock — buyers always get instant access.
              </div>
            </>
          )}
        </div>

        {/* ── Shipping (physical only) ─────────────────────── */}
        {productType === "PHYSICAL" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
              Shipping
            </h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Ships To *</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SHIPPING_ZONES.map((z) => (
                  <button
                    key={z.value}
                    type="button"
                    onClick={() => toggleZone(z.value)}
                    className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all ${
                      selectedZones.includes(z.value)
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-sm font-semibold text-gray-800">{z.label}</span>
                    <span className="text-xs text-gray-400 mt-0.5">{z.desc}</span>
                  </button>
                ))}
              </div>
              {selectedZones.map((z) => (
                <input key={z} type="hidden" name="shippingZones" value={z} />
              ))}
            </div>
            {/* shipsFromCity input moved into the grid below for proper layout */}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Ships From City</span>
                </label>
                <input
                  name="shipsFromCity"
                  defaultValue={shipsFromCity ?? undefined}
                  onChange={(e) => setShipsFromCity(e.target.value)}
                  placeholder="e.g. Lagos"
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Weight (kg)</span>
                </label>
                <input
                  name="weight"
                  type="number"
                  defaultValue={weightVal ?? undefined}
                  onChange={(e) => setWeightVal(e.target.value ? Number(e.target.value) : undefined)}
                  min="0"
                  step="0.1"
                  placeholder="0.5"
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Shipping Fees (₦) — leave blank for defaults</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {selectedZones.includes("NIGERIA") && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">🇳🇬 Nigeria Fee</label>
                    <input name="nigeriaFee" defaultValue={nigeriaFeeVal ?? undefined} onChange={(e) => setNigeriaFeeVal(e.target.value ? Number(e.target.value) : undefined)} type="number" min="0" step="1" placeholder="2,000"
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
                  </div>
                )}
                {selectedZones.includes("AFRICA") && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">🌍 Africa Fee</label>
                    <input name="africaFee" defaultValue={africaFeeVal ?? undefined} onChange={(e) => setAfricaFeeVal(e.target.value ? Number(e.target.value) : undefined)} type="number" min="0" step="1" placeholder="8,000"
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
                  </div>
                )}
                {selectedZones.includes("INTERNATIONAL") && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">🌐 International Fee</label>
                    <input name="internationalFee" defaultValue={internationalFeeVal ?? undefined} onChange={(e) => setInternationalFeeVal(e.target.value ? Number(e.target.value) : undefined)} type="number" min="0" step="1" placeholder="20,000"
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">Defaults: Nigeria ₦2,000 · Africa ₦8,000 · International ₦20,000</p>
            </div>
          </div>
        )}

        {/* ── Product Variants ─────────────────────────── */}
        {productType === "PHYSICAL" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Product Variants</h2>
                <p className="text-xs text-gray-400 mt-0.5">e.g. Size, Color, Storage capacity</p>
              </div>
              {variants.length === 0 && (
                <span className="text-xs text-gray-400">Optional</span>
              )}
            </div>

            {/* Variant group name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Option Name</label>
              <input
                value={variantGroupName}
                onChange={(e) => setVariantGroupName(e.target.value)}
                placeholder="e.g. Size, Color, Material…"
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              />
            </div>

            {/* Existing variants */}
            {variants.length > 0 && (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-400 px-1">
                  <span className="col-span-3">Value</span>
                  <span className="col-span-3">Price (₦)</span>
                  <span className="col-span-3">Stock</span>
                  <span className="col-span-2">SKU</span>
                  <span className="col-span-1" />
                </div>
                {variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-xl px-2 py-2">
                    <input
                      value={v.value}
                      onChange={(e) => setVariants((prev) => prev.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
                      placeholder="e.g. XL"
                      className="col-span-3 h-8 px-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary-400"
                    />
                    <input
                      type="number"
                      min="0"
                      value={v.price ?? ""}
                      onChange={(e) => setVariants((prev) => prev.map((x, j) => j === i ? { ...x, price: e.target.value ? parseFloat(e.target.value) : undefined } : x))}
                      placeholder="Base"
                      className="col-span-3 h-8 px-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary-400"
                    />
                    <input
                      type="number"
                      min="0"
                      value={v.stock}
                      onChange={(e) => setVariants((prev) => prev.map((x, j) => j === i ? { ...x, stock: parseInt(e.target.value) || 0 } : x))}
                      placeholder="0"
                      className="col-span-3 h-8 px-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary-400"
                    />
                    <input
                      value={v.sku ?? ""}
                      onChange={(e) => setVariants((prev) => prev.map((x, j) => j === i ? { ...x, sku: e.target.value || undefined } : x))}
                      placeholder="SKU"
                      className="col-span-2 h-8 px-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary-400"
                    />
                    <button
                      type="button"
                      onClick={() => setVariants((prev) => prev.filter((_, j) => j !== i))}
                      className="col-span-1 flex items-center justify-center h-8 w-8 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add a variant */}
            <button
              type="button"
              onClick={() => {
                if (!variantGroupName.trim()) return;
                setVariants((prev) => [...prev, { name: variantGroupName.trim(), value: "", stock: 1 }]);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary-400 hover:bg-primary-50 text-sm font-semibold text-gray-500 hover:text-primary-600 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Variant
            </button>
            {!variantGroupName.trim() && variants.length === 0 && (
              <p className="text-xs text-gray-400 -mt-2">Enter an option name above first, then click Add Variant.</p>
            )}
          </div>
        )}

        {/* ── Tags ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
            Tags
          </h2>
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
            placeholder="Type a tag and press Enter…"
            className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
          />
          <p className="text-xs text-gray-400 mt-2">Up to 10 tags. Press Enter or comma to add.</p>
        </div>

        {/* ── Visibility ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
            Visibility
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">List as Active</p>
              <p className="text-xs text-gray-400 mt-0.5">Make this product visible and purchasable immediately.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input name="isActive" type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
            </label>
          </div>
        </div>

        {/* ── Submit ──────────────────────────────────────── */}
        <div className="flex items-center gap-3 pb-6">
          <button
            type="submit"
            disabled={saving || saved}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-bold transition-colors"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Plus className="w-4 h-4" /> Create Listing</>}
          </button>
          <Link
            href="/dashboard/seller/listings"
            className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
