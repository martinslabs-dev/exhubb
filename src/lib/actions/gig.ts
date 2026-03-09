"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ─── Create Gig ──────────────────────────────────────────────
export async function createGigAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  if (!session.user.isFreelancer) return { error: "Not a freelancer account" };

  const title        = (formData.get("title")            as string)?.trim();
  const description  = (formData.get("description")      as string)?.trim() || null;
  const category     = (formData.get("category")         as string)?.trim();
  const deliveryDays = parseInt(formData.get("deliveryDays") as string, 10);
  const basicPrice   = parseFloat(formData.get("basicPrice") as string);
  const standardPrice = formData.get("standardPrice") ? parseFloat(formData.get("standardPrice") as string) : null;
  const premiumPrice  = formData.get("premiumPrice")  ? parseFloat(formData.get("premiumPrice")  as string) : null;
  const tagsRaw       = (formData.get("tags") as string) ?? "";
  const tags          = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const samplesRaw    = (formData.get("samples") as string) ?? "";
  const samples       = samplesRaw ? samplesRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const isActive      = formData.get("isActive") === "on";

  if (!title)             return { error: "Title is required" };
  if (!category)          return { error: "Category is required" };
  if (isNaN(deliveryDays) || deliveryDays < 1) return { error: "Delivery time is required" };
  if (isNaN(basicPrice)   || basicPrice < 1)   return { error: "Basic price must be at least $1" };
  if (standardPrice !== null && standardPrice <= basicPrice)
    return { error: "Standard price must be higher than Basic price" };
  if (premiumPrice !== null && standardPrice !== null && premiumPrice <= standardPrice)
    return { error: "Premium price must be higher than Standard price" };

  const gig = await prisma.gig.create({
    data: {
      freelancerId: session.user.id,
      title,
      description,
      category,
      deliveryDays,
      basicPrice,
      standardPrice,
      premiumPrice,
      tags,
      samples,
      isActive,
    },
  });

  revalidatePath("/dashboard/freelancer/gigs");
  return { success: true, gigId: gig.id };
}

// ─── Update Gig ──────────────────────────────────────────────
export async function updateGigAction(gigId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const existing = await prisma.gig.findUnique({
    where: { id: gigId },
    select: { freelancerId: true },
  });
  if (!existing || existing.freelancerId !== session.user.id) return { error: "Not found" };

  const title        = (formData.get("title")        as string)?.trim();
  const description  = (formData.get("description")  as string)?.trim() || null;
  const category     = (formData.get("category")     as string)?.trim();
  const deliveryDays = parseInt(formData.get("deliveryDays") as string, 10);
  const basicPrice   = parseFloat(formData.get("basicPrice") as string);
  const standardPrice = formData.get("standardPrice") ? parseFloat(formData.get("standardPrice") as string) : null;
  const premiumPrice  = formData.get("premiumPrice")  ? parseFloat(formData.get("premiumPrice")  as string) : null;
  const tagsRaw    = (formData.get("tags")    as string) ?? "";
  const samplesRaw = (formData.get("samples") as string) ?? "";
  const tags    = tagsRaw    ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const samples = samplesRaw ? samplesRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const isActive = formData.get("isActive") === "on";

  if (!title)             return { error: "Title is required" };
  if (!category)          return { error: "Category is required" };
  if (isNaN(deliveryDays) || deliveryDays < 1) return { error: "Delivery time is required" };
  if (isNaN(basicPrice)   || basicPrice < 1)   return { error: "Basic price must be at least $1" };
  if (standardPrice !== null && standardPrice <= basicPrice)
    return { error: "Standard price must be higher than Basic price" };
  if (premiumPrice !== null && standardPrice !== null && premiumPrice <= standardPrice)
    return { error: "Premium price must be higher than Standard price" };

  await prisma.gig.update({
    where: { id: gigId },
    data: { title, description, category, deliveryDays, basicPrice, standardPrice, premiumPrice, tags, samples, isActive },
  });

  revalidatePath("/dashboard/freelancer/gigs");
  revalidatePath(`/gigs/${gigId}`);
  return { success: true };
}

// ─── Toggle Gig Active State ─────────────────────────────────
export async function toggleGigActiveAction(gigId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const gig = await prisma.gig.findUnique({
    where: { id: gigId },
    select: { freelancerId: true, isActive: true },
  });
  if (!gig || gig.freelancerId !== session.user.id) return { error: "Not found" };

  await prisma.gig.update({
    where: { id: gigId },
    data: { isActive: !gig.isActive },
  });

  revalidatePath("/dashboard/freelancer/gigs");
  return { success: true };
}

// ─── Delete Gig ──────────────────────────────────────────────
export async function deleteGigAction(gigId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const gig = await prisma.gig.findUnique({
    where: { id: gigId },
    select: { freelancerId: true },
  });
  if (!gig || gig.freelancerId !== session.user.id) return { error: "Not found" };

  await prisma.gig.delete({ where: { id: gigId } });

  revalidatePath("/dashboard/freelancer/gigs");
  return { success: true };
}
