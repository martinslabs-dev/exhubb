"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ─── Update Seller Store Profile ─────────────────────────────
export async function updateSellerStoreAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  if (!session.user.isSeller) return { error: "Not a seller account" };

  const storeName = (formData.get("storeName") as string)?.trim();
  const storeSlug = (formData.get("storeSlug") as string)?.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const storeBio  = (formData.get("storeBio")  as string)?.trim();
  const storeLogo   = (formData.get("storeLogo")   as string)?.trim() || null;
  const storeBanner = (formData.get("storeBanner") as string)?.trim() || null;

  if (!storeName) return { error: "Store name is required" };
  if (!storeSlug) return { error: "Store URL is required" };
  if (!/^[a-z0-9-]+$/.test(storeSlug)) return { error: "Store URL can only contain letters, numbers, and hyphens" };

  // Only accept trusted upload paths or https:// URLs (prevents javascript: / data: XSS)
  const isTrustedUrl = (v: string | null) => !v || v.startsWith("/uploads/") || v.startsWith("https://");
  if (!isTrustedUrl(storeLogo))   return { error: "Invalid logo URL" };
  if (!isTrustedUrl(storeBanner)) return { error: "Invalid banner URL" };

  // Check slug uniqueness (excluding current user)
  const existing = await prisma.user.findFirst({
    where: { storeSlug, NOT: { id: session.user.id } },
    select: { id: true },
  });
  if (existing) return { error: "That store URL is already taken" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { storeName, storeSlug, storeBio: storeBio || null, storeLogo, storeBanner },
  });

  revalidatePath("/dashboard/seller/store");
  revalidatePath(`/store/${storeSlug}`);
  return { success: true, storeSlug };
}

// ─── Update Bank / Payout Details ────────────────────────────
export async function updateBankDetailsAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const bankName          = (formData.get("bankName")          as string)?.trim();
  const bankAccountName   = (formData.get("bankAccountName")   as string)?.trim();
  const bankAccountNumber = (formData.get("bankAccountNumber") as string)?.trim();

  if (!bankName || !bankAccountName || !bankAccountNumber) {
    return { error: "All bank fields are required" };
  }
  if (!/^\d{10}$/.test(bankAccountNumber)) {
    return { error: "Account number must be exactly 10 digits" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { bankName, bankAccountName, bankAccountNumber },
  });

  revalidatePath("/dashboard/seller/store");
  return { success: true };
}
