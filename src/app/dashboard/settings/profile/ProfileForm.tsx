"use client";
// settings: profile form
import { useActionState, useRef, useState } from "react";
import { updateProfileAction } from "@/lib/actions/settings";
import { CheckCircle2, AlertCircle, Loader2, Camera } from "lucide-react";

interface Props {
  user: {
    name:     string | null;
    email:    string | null;
    bio:      string | null;
    location: string | null;
    website:  string | null;
    image:    string | null;
  };
}

export default function ProfileForm({ user }: Props) {
  const [state, formAction, pending] = useActionState(updateProfileAction, null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview]       = useState<string | null>(user.image);
  const [imageUrl, setImageUrl]     = useState<string | null>(user.image);
  const [uploading, setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const initials = (user.name ?? "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show local preview immediately
    setPreview(URL.createObjectURL(file));
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setImageUrl(data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      setPreview(user.image); // revert preview on error
      setImageUrl(user.image);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Pass uploaded image URL as hidden field */}
      <input type="hidden" name="image" value={imageUrl ?? ""} />

      {state?.success && (
        <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Profile updated successfully.
        </div>
      )}
      {state && !state.success && state.error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {state.error}
        </div>
      )}

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-4">Profile Photo</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-black text-xl select-none">
                {initials}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors disabled:opacity-60"
            >
              {uploading
                ? <Loader2 className="w-3 h-3 text-white animate-spin" />
                : <Camera className="w-3 h-3 text-white" />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">{user.name ?? "Your Name"}</p>
            <p className="text-xs text-gray-400">{user.email}</p>
            {uploading && <p className="text-xs text-primary-600 mt-1">Uploading…</p>}
            {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
            {!uploading && !uploadError && <p className="text-xs text-gray-400 mt-1">Click the camera icon to change photo</p>}
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900">Basic Info</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-gray-600 mb-1.5">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              id="name" name="name" type="text"
              defaultValue={user.name ?? ""} placeholder="e.g. Ada Obi"
              required maxLength={60}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
            <input
              type="email" value={user.email ?? ""} readOnly
              className="w-full px-3.5 py-2.5 text-sm border border-gray-100 rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed outline-none"
            />
            <p className="text-[10px] text-gray-400 mt-1 px-1">Email cannot be changed here</p>
          </div>
        </div>

        <div>
          <label htmlFor="bio" className="block text-xs font-semibold text-gray-600 mb-1.5">
            Bio <span className="text-gray-400 font-normal">— optional</span>
          </label>
          <textarea
            id="bio" name="bio" rows={3}
            defaultValue={user.bio ?? ""} placeholder="Tell buyers and clients a little about yourself…"
            maxLength={300}
            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="location" className="block text-xs font-semibold text-gray-600 mb-1.5">
              Location <span className="text-gray-400 font-normal">— optional</span>
            </label>
            <input
              id="location" name="location" type="text"
              defaultValue={user.location ?? ""} placeholder="e.g. Lagos, Nigeria"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div>
            <label htmlFor="website" className="block text-xs font-semibold text-gray-600 mb-1.5">
              Website <span className="text-gray-400 font-normal">— optional</span>
            </label>
            <input
              id="website" name="website" type="url"
              defaultValue={user.website ?? ""} placeholder="https://yourwebsite.com"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit" disabled={pending}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          {pending ? "Saving…" : "Save Changes"}
        </button>
      </div>

    </form>
  );
}
