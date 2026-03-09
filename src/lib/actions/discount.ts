"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ─── Validate a discount code at checkout ─────────────────────
export async function validateDiscountCodeAction(code: string, orderAmount: number, sellerId: string) {
  if (!code?.trim()) return { error: "Please enter a discount code" };

  const discount = await prisma.discountCode.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!discount)                             return { error: "Invalid discount code" };
  if (!discount.isActive)                    return { error: "This discount code is no longer active" };
  if (discount.sellerId !== sellerId)        return { error: "This code is not valid for this seller" };
  if (discount.expiresAt && discount.expiresAt < new Date()) return { error: "This discount code has expired" };
  if (discount.maxUses != null && discount.usedCount >= discount.maxUses) return { error: "This discount code has reached its usage limit" };
  if (discount.minOrderAmount && orderAmount < discount.minOrderAmount) {
    return { error: `Minimum order amount for this code is ₦${discount.minOrderAmount.toLocaleString()}` };
  }

  const discountAmount =
    discount.type === "PERCENTAGE"
      ? Math.floor((orderAmount * discount.value) / 100)
      : Math.min(discount.value, orderAmount);

  return {
    success: true,
    discountCodeId: discount.id,
    discountAmount,
    code: discount.code,
    type: discount.type,
    value: discount.value,
  };
}

// ─── Create a discount code (seller) ─────────────────────────
export async function createDiscountCodeAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const code           = (formData.get("code") as string)?.trim().toUpperCase();
  const type           = formData.get("type") as "PERCENTAGE" | "FLAT";
  const value          = parseFloat(formData.get("value") as string);
  const minOrderAmount = formData.get("minOrderAmount") ? parseFloat(formData.get("minOrderAmount") as string) : null;
  const maxUses        = formData.get("maxUses") ? parseInt(formData.get("maxUses") as string, 10) : null;
  const expiresAt      = formData.get("expiresAt") ? new Date(formData.get("expiresAt") as string) : null;

  if (!code)               return { error: "Code is required" };
  if (!type)               return { error: "Type is required" };
  if (isNaN(value) || value <= 0) return { error: "Value must be greater than 0" };
  if (type === "PERCENTAGE" && value > 100) return { error: "Percentage cannot exceed 100" };

  // Check uniqueness
  const existing = await prisma.discountCode.findUnique({ where: { code } });
  if (existing) return { error: "This code is already in use. Please choose a different code." };

  await prisma.discountCode.create({
    data: {
      sellerId: session.user.id,
      code,
      type,
      value,
      minOrderAmount,
      maxUses,
      expiresAt,
    },
  });

  revalidatePath("/dashboard/seller/discounts");
  return { success: true };
}

// ─── Toggle discount code active/inactive ─────────────────────
export async function toggleDiscountCodeAction(id: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  await prisma.discountCode.updateMany({
    where: { id, sellerId: session.user.id },
    data: { isActive },
  });

  revalidatePath("/dashboard/seller/discounts");
  return { success: true };
}

// ─── Delete a discount code ───────────────────────────────────
export async function deleteDiscountCodeAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  await prisma.discountCode.deleteMany({
    where: { id, sellerId: session.user.id },
  });

  revalidatePath("/dashboard/seller/discounts");
  return { success: true };
}
