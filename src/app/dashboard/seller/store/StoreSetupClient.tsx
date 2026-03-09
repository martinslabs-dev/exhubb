"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Store, Globe, Camera, Building2,
  CreditCard, CheckCircle2, Loader2, ExternalLink,
  AlertCircle, BadgeCheck, Clock, ShieldOff,
} from "lucide-react";
import { updateSellerStoreAction, updateBankDetailsAction } from "@/lib/actions/store";

const NIGERIAN_BANKS = [
  "Access Bank", "First Bank of Nigeria", "Guaranty Trust Bank (GTBank)",
  "United Bank for Africa (UBA)", "Zenith Bank", "Fidelity Bank",
  "Ecobank Nigeria", "First City Monument Bank (FCMB)", "Heritage Bank",
  "Keystone Bank", "Polaris Bank", "Stanbic IBTC Bank", "Sterling Bank",
  "Union Bank", "Wema Bank", "Opay", "Palmpay", "Kuda Bank",
  "Moniepoint", "Carbon", "VFD Microfinance Bank",
];

interface StorePageClientProps {
  user: {
    id: string;
    storeName: string | null;
    storeSlug: string | null;
    storeBio: string | null;
    storeLogo: string | null;
    storeBanner: string | null;
    bankName: string | null;
    bankAccountName: string | null;
    bankAccountNumber: string | null;
    sellerStatus: string;
    isSellerVerified: boolean;
  };
}

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending Review",
    desc: "Your store is awaiting verification. You can list products but payouts are limited.",
    color: "bg-yellow-50 border-yellow-200 text-yellow-800",
    icon: Clock,
  },
  VERIFIED: {
    label: "Verified Seller",
    desc: "Your store is fully verified. All features and payouts are unlocked.",
    color: "bg-green-50 border-green-200 text-green-800",
    icon: BadgeCheck,
  },
  SUSPENDED: {
    label: "Suspended",
    desc: "Your store has been suspended. Contact support to resolve this.",
    color: "bg-red-50 border-red-200 text-red-800",
    icon: ShieldOff,
  },
};

export default function StoreSetupClient({ user }: StorePageClientProps) {
  const router = useRouter();

  // Store profile state
  const [storeName,   setStoreName]   = useState(user.storeName ?? "");
  const [storeSlug,   setStoreSlug]   = useState(user.storeSlug ?? "");
  const [storeBio,    setStoreBio]    = useState(user.storeBio ?? "");
  const [storeLogo,   setStoreLogo]   = useState(user.storeLogo ?? "");
  const [storeBanner, setStoreBanner] = useState(user.storeBanner ?? "");
  const [storeErrors, setStoreErrors] = useState<Record<string, string>>({});
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeSaved,  setStoreSaved]  = useState(false);

  // Banner upload state
  const [bannerPreview,    setBannerPreview]    = useState<string | null>(null);
  const [bannerIsVideo,    setBannerIsVideo]    = useState(() =>
    /\.(mp4|webm|mov)$/i.test(user.storeBanner ?? ""));
  const [bannerUploading,  setBannerUploading]  = useState(false);
  const [bannerError,      setBannerError]      = useState<string | null>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);

  // Logo upload state
  const [logoPreview,   setLogoPreview]   = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError,     setLogoError]     = useState<string | null>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);

  // Bank state
  const [bankName,    setBankName]    = useState(user.bankName ?? "");
  const [bankAccName, setBankAccName] = useState(user.bankAccountName ?? "");
  const [bankAccNum,  setBankAccNum]  = useState(user.bankAccountNumber ?? "");
  const [bankErrors,  setBankErrors]  = useState<Record<string, string>>({});
  const [bankSaving,  setBankSaving]  = useState(false);
  const [bankSaved,   setBankSaved]   = useState(false);

  // ── Media upload helpers ──────────────────────────────────
  async function uploadMedia(file: File): Promise<{ url: string } | { error: string }> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) return { error: data.error ?? "Upload failed" };
    return { url: data.url as string };
  }

  function getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      const url = URL.createObjectURL(file);
      video.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(video.duration); };
      video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("unreadable")); };
      video.src = url;
    });
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerError(null);
    const isVid = file.type.startsWith("video/");
    if (isVid) {
      try {
        const dur = await getVideoDuration(file);
        if (dur > 8) { setBannerError("Video must be 8 seconds or shorter."); return; }
      } catch {
        setBannerError("Could not read video duration."); return;
      }
    }
    setBannerPreview(URL.createObjectURL(file));
    setBannerIsVideo(isVid);
    setBannerUploading(true);
    const result = await uploadMedia(file);
    setBannerUploading(false);
    if ("error" in result) { setBannerError(result.error); return; }
    setStoreBanner(result.url);
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);
    setLogoPreview(URL.createObjectURL(file));
    setLogoUploading(true);
    const result = await uploadMedia(file);
    setLogoUploading(false);
    if ("error" in result) { setLogoError(result.error); return; }
    setStoreLogo(result.url);
  }

  // Auto-generate slug from store name
  function handleStoreName(val: string) {
    setStoreName(val);
    if (!user.storeSlug) {
      setStoreSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    }
  }

  async function handleStoreSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStoreSaving(true);
    setStoreErrors({});
    const form = new FormData(e.currentTarget);
    const result = await updateSellerStoreAction(form);
    if (result?.error) {
      setStoreErrors({ submit: result.error });
      setStoreSaving(false);
      return;
    }
    setStoreSaved(true);
    setTimeout(() => setStoreSaved(false), 3000);
    setStoreSaving(false);
    router.refresh();
  }

  async function handleBankSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBankSaving(true);
    setBankErrors({});
    const form = new FormData(e.currentTarget);
    const result = await updateBankDetailsAction(form);
    if (result?.error) {
      setBankErrors({ submit: result.error });
      setBankSaving(false);
      return;
    }
    setBankSaved(true);
    setTimeout(() => setBankSaved(false), 3000);
    setBankSaving(false);
  }

  const status = STATUS_CONFIG[user.sellerStatus as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING;
  const StatusIcon = status.icon;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/seller"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-black text-gray-900">My Store</h1>
        <p className="text-sm text-gray-500 mt-0.5">Set up your public store profile and payout details.</p>
      </div>

      {/* Store status banner */}
      <div className={`flex items-start gap-3 rounded-2xl border p-4 mb-6 ${status.color}`}>
        <StatusIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold">{status.label}</p>
          <p className="text-xs mt-0.5 opacity-80">{status.desc}</p>
        </div>
      </div>

      {/* ── Store Profile ─────────────────────────────────── */}
      <form onSubmit={handleStoreSubmit} className="space-y-5 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <Store className="w-4 h-4" /> Store Profile
          </h2>

          {storeSaved && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Store profile saved!
            </div>
          )}
          {storeErrors.submit && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" /> {storeErrors.submit}
            </div>
          )}

          {/* Banner upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5"><Camera className="w-3.5 h-3.5" /> Store Banner</span>
            </label>
            <div
              onClick={() => !bannerUploading && bannerFileRef.current?.click()}
              className="relative w-full h-36 rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 hover:border-primary-400 transition-colors cursor-pointer group"
            >
              {bannerPreview || storeBanner ? (
                bannerIsVideo || (!bannerPreview && /\.(mp4|webm|mov)$/i.test(storeBanner)) ? (
                  <video
                    src={bannerPreview ?? storeBanner}
                    className="w-full h-full object-cover"
                    muted autoPlay loop playsInline
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bannerPreview ?? storeBanner} alt="banner" className="w-full h-full object-cover" />
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 pointer-events-none">
                  <Camera className="w-7 h-7 text-gray-300" />
                  <p className="text-xs font-medium text-gray-400">Click to upload banner</p>
                  <p className="text-[11px] text-gray-400">Image or short video (&le;8 s) &bull; JPG, PNG, WebP, MP4, WebM</p>
                </div>
              )}
              {/* Hover overlay */}
              {(bannerPreview || storeBanner) && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {bannerUploading
                    ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                    : <><Camera className="w-5 h-5 text-white" /><span className="text-white text-xs font-semibold">Change</span></>}
                </div>
              )}
              {bannerUploading && !(bannerPreview || storeBanner) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              )}
            </div>
            {bannerError && <p className="text-xs text-red-500 mt-1.5">{bannerError}</p>}
            <input ref={bannerFileRef} type="file" className="hidden"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime"
              onChange={handleBannerChange} />
            <input type="hidden" name="storeBanner" value={storeBanner} />
          </div>

          {/* Logo + label row */}
          <div className="flex gap-4 items-start">
            {/* Logo click-to-upload */}
            <div className="flex-shrink-0">
              <div
                onClick={() => !logoUploading && logoFileRef.current?.click()}
                className="relative w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden border-2 border-gray-200 hover:border-primary-400 transition-colors cursor-pointer group"
              >
                {logoPreview || storeLogo
                  ? // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview ?? storeLogo} alt="logo" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <Store className="w-6 h-6 text-gray-300" />
                    </div>
                }
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                  {logoUploading
                    ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                    : <Camera className="w-4 h-4 text-white" />}
                </div>
              </div>
              <input ref={logoFileRef} type="file" className="hidden"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                onChange={handleLogoChange} />
              <input type="hidden" name="storeLogo" value={storeLogo} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Store Logo</label>
              <p className="text-xs text-gray-500">Click the square to upload. Square image recommended (min 200×200 px).</p>
              {logoError && <p className="text-xs text-red-500 mt-1">{logoError}</p>}
            </div>
          </div>

          {/* Store name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Store Name *</label>
            <input
              name="storeName"
              value={storeName}
              onChange={(e) => handleStoreName(e.target.value)}
              placeholder="e.g. TechGadgets NG"
              className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>

          {/* Store URL / slug */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Store URL *</span>
            </label>
            <div className="flex items-center rounded-xl border border-gray-200 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 transition-all overflow-hidden">
              <span className="px-3 py-3 text-sm text-gray-400 bg-gray-50 border-r border-gray-200 flex-shrink-0">
                exhubb.com/store/
              </span>
              <input
                name="storeSlug"
                value={storeSlug}
                onChange={(e) => setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                placeholder="your-store-name"
                className="flex-1 h-11 px-3 text-sm outline-none bg-white"
              />
            </div>
            {storeSlug && (
              <Link
                href={`/store/${storeSlug}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 mt-1.5"
              >
                <ExternalLink className="w-3 h-3" /> Preview your store
              </Link>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Store Bio</label>
            <textarea
              name="storeBio"
              value={storeBio}
              onChange={(e) => setStoreBio(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="Tell buyers about your store, what you sell, your story…"
              className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{storeBio.length}/300 characters</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={storeSaving}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-bold transition-colors"
          >
            {storeSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><CheckCircle2 className="w-4 h-4" /> Save Store Profile</>}
          </button>
        </div>
      </form>

      {/* ── Bank / Payout Details ──────────────────────────── */}
      <form onSubmit={handleBankSubmit} className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Payout / Bank Details
          </h2>
          <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
            Your bank details are used to process payouts when buyers confirm receipt of orders.
            This information is kept private and never shown publicly.
          </p>

          {bankSaved && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Bank details saved!
            </div>
          )}
          {bankErrors.submit && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" /> {bankErrors.submit}
            </div>
          )}

          {/* Bank name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Bank Name *</span>
            </label>
            <select
              name="bankName"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all bg-white"
            >
              <option value="">Select your bank</option>
              {NIGERIAN_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Account name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Account Name *</label>
              <input
                name="bankAccountName"
                value={bankAccName}
                onChange={(e) => setBankAccName(e.target.value)}
                placeholder="As on your bank account"
                className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              />
            </div>
            {/* Account number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Account Number *</label>
              <input
                name="bankAccountNumber"
                value={bankAccNum}
                onChange={(e) => setBankAccNum(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit NUBAN"
                inputMode="numeric"
                maxLength={10}
                className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              />
            </div>
          </div>

          {/* Masked display if already saved */}
          {user.bankAccountNumber && (
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
              <CreditCard className="w-4 h-4" />
              Saved: {user.bankName} — ••••••{user.bankAccountNumber.slice(-4)}
            </div>
          )}
        </div>

        <div className="flex justify-end pb-6">
          <button
            type="submit"
            disabled={bankSaving}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-bold transition-colors"
          >
            {bankSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><CheckCircle2 className="w-4 h-4" /> Save Bank Details</>}
          </button>
        </div>
      </form>
    </div>
  );
}
