"use server";

import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ─── Update Profile ───────────────────────────────────────────
export async function updateProfileAction(
  _prev: { success: boolean; error?: string } | null,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const name     = (formData.get("name") as string | null)?.trim();
  const bio      = (formData.get("bio") as string | null)?.trim() ?? null;
  const location = (formData.get("location") as string | null)?.trim() ?? null;
  const website  = (formData.get("website") as string | null)?.trim() ?? null;
  const image    = (formData.get("image") as string | null)?.trim() || null;

  if (!name || name.length < 2) return { success: false, error: "Name must be at least 2 characters." };
  if (name.length > 60)         return { success: false, error: "Name must be 60 characters or fewer." };
  if (website && !/^https?:\/\//i.test(website))
    return { success: false, error: "Website must start with http:// or https://" };
  // Only accept relative /uploads/ paths or https URLs to prevent SSRF
  if (image && !/^\/uploads\//.test(image) && !/^https:\/\//i.test(image))
    return { success: false, error: "Invalid image URL." };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name, bio, location, website, image },
  });

  // Revalidate dashboard and user image endpoint for Navbar
  revalidatePath("/dashboard", "layout");
  revalidatePath("/api/me/image");
  return { success: true };
}

// ─── Change Password ──────────────────────────────────────────
export async function changePasswordAction(
  _prev: { success: boolean; error?: string } | null,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const current    = (formData.get("current") as string | null) ?? "";
  const newPass    = (formData.get("new") as string | null) ?? "";
  const confirmNew = (formData.get("confirm") as string | null) ?? "";

  if (!current || !newPass || !confirmNew)
    return { success: false, error: "All fields are required." };
  if (newPass.length < 8)
    return { success: false, error: "New password must be at least 8 characters." };
  if (newPass !== confirmNew)
    return { success: false, error: "New passwords do not match." };

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { password: true },
  });

  if (!user?.password)
    return { success: false, error: "Password login is not enabled for this account." };

  const valid = await bcrypt.compare(current, user.password);
  if (!valid)
    return { success: false, error: "Current password is incorrect." };

  const hashed = await bcrypt.hash(newPass, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data:  { password: hashed },
  });

  return { success: true };
}

// ─── Save Notification Prefs (placeholder — no schema field yet) ──
export async function saveNotifPrefsAction(
  _prev: { success: boolean } | null,
  _formData: FormData
): Promise<{ success: boolean }> {
  // TODO: persist when notifPrefs JSON column is added to User schema
  await new Promise((r) => setTimeout(r, 300)); // simulate save
  return { success: true };
}
