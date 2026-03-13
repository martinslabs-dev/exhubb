"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// ─── Create Product Listing ───────────────────────────────────
export async function createListingAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const title       = formData.get("title")       as string;
  const description = formData.get("description") as string;
  const category    = formData.get("category")    as string;
  const subcategory = formData.get("subcategory") as string | null;
  const price       = parseFloat(formData.get("price") as string);
  const productType = (formData.get("productType") as string ?? "PHYSICAL") === "DIGITAL" ? "DIGITAL" : "PHYSICAL";

  const digitalFiles    = formData.getAll("digitalFiles")    as string[];
  const digitalFileNames = formData.getAll("digitalFileNames") as string[];

  const unlimitedStock = formData.get("unlimitedStock") === "on" || productType === "DIGITAL";
  const stockRaw = parseInt(formData.get("stock") as string, 10);
  const stock = productType === "DIGITAL" ? 999999 : (unlimitedStock ? 999999 : stockRaw);

  if (!title || !category || isNaN(price)) {
    return { error: "Missing required fields" };
  }
  if (productType === "PHYSICAL" && !unlimitedStock && isNaN(stockRaw)) {
    return { error: "Stock quantity is required for physical products" };
  }
  if (productType === "DIGITAL" && digitalFiles.length === 0) {
    return { error: "At least one digital file is required" };
  }

  const images       = formData.getAll("images")       as string[];
  const tags         = formData.getAll("tags")         as string[];
  const shippingZones = productType === "DIGITAL"
    ? [] as ("NIGERIA" | "AFRICA" | "INTERNATIONAL")[]
    : formData.getAll("shippingZones") as ("NIGERIA" | "AFRICA" | "INTERNATIONAL")[];
  const shipsFromCity = formData.get("shipsFromCity")  as string | null;
  const weight       = formData.get("weight")       ? parseFloat(formData.get("weight") as string) : null;
  const compareAtPrice = formData.get("compareAtPrice") ? parseFloat(formData.get("compareAtPrice") as string) : null;
  const nigeriaFee   = formData.get("nigeriaFee")   ? parseFloat(formData.get("nigeriaFee") as string) : null;
  const africaFee    = formData.get("africaFee")    ? parseFloat(formData.get("africaFee") as string) : null;
  const internationalFee = formData.get("internationalFee") ? parseFloat(formData.get("internationalFee") as string) : null;
  const isActive     = formData.get("isActive") === "on";

  // Parse variants JSON array from form
  const variantsRaw = formData.get("variants") as string | null;
  const variants: { name: string; value: string; price?: number; stock: number; sku?: string }[] =
    variantsRaw ? (JSON.parse(variantsRaw) as { name: string; value: string; price?: number; stock: number; sku?: string }[]) : [];

  const product = await prisma.product.create({
    data: {
      sellerId: session.user.id,
      title,
      description: description || null,
      category,
      subcategory: subcategory || null,
      price,
      compareAtPrice,
      stock,
      unlimitedStock,
      tags,
      images,
      isActive,
      productType: productType as "PHYSICAL" | "DIGITAL",
      digitalFiles,
      digitalFileNames,
      shippingZones,
      shipsFromCity: shipsFromCity || null,
      shipsFromCountry: "NG",
      weight: productType === "DIGITAL" ? null : weight,
      nigeriaFee:   productType === "DIGITAL" ? null : nigeriaFee,
      africaFee:    productType === "DIGITAL" ? null : africaFee,
      internationalFee: productType === "DIGITAL" ? null : internationalFee,
    },
  });

  if (variants.length > 0) {
    await prisma.productVariant.createMany({
      data: variants.map((v) => ({
        productId: product.id,
        name:  v.name,
        value: v.value,
        price: v.price ?? null,
        stock: v.stock,
        sku:   v.sku ?? null,
      })),
    });
  }

  revalidatePath("/dashboard/seller/listings");
  redirect("/dashboard/seller/listings");
}

// ─── Update Product Listing ───────────────────────────────────
export async function updateListingAction(productId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  // Verify ownership
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { sellerId: true },
  });
  if (!product || product.sellerId !== session.user.id) {
    return { error: "Unauthorized" };
  }

  const title       = formData.get("title")       as string;
  const description = formData.get("description") as string;
  const category    = formData.get("category")    as string;
  const subcategory = formData.get("subcategory") as string | null;
  const price       = parseFloat(formData.get("price") as string);
  const stock       = parseInt(formData.get("stock") as string, 10);
  const shippingZones = formData.getAll("shippingZones") as ("NIGERIA" | "AFRICA" | "INTERNATIONAL")[];
  const shipsFromCity = formData.get("shipsFromCity")  as string | null;
  const weight       = formData.get("weight")       ? parseFloat(formData.get("weight") as string) : null;
  const nigeriaFee   = formData.get("nigeriaFee")   ? parseFloat(formData.get("nigeriaFee") as string) : null;
  const africaFee    = formData.get("africaFee")    ? parseFloat(formData.get("africaFee") as string) : null;
  const internationalFee = formData.get("internationalFee") ? parseFloat(formData.get("internationalFee") as string) : null;
  const isActive     = formData.get("isActive") === "on";

  await prisma.product.update({
    where: { id: productId },
    data: {
      title, description: description || null, category,
      subcategory: subcategory || null,
      price, stock, isActive, shippingZones,
      shipsFromCity: shipsFromCity || null,
      weight, nigeriaFee, africaFee, internationalFee,
    },
  });

  revalidatePath("/dashboard/seller/listings");
  redirect("/dashboard/seller/listings");
}

// ─── Toggle listing active/inactive ──────────────────────────
export async function toggleListingAction(productId: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  await prisma.product.updateMany({
    where: { id: productId, sellerId: session.user.id },
    data:  { isActive },
  });

  revalidatePath("/dashboard/seller/listings");
  return { success: true };
}

// ─── Delete listing ───────────────────────────────────────────
export async function deleteListingAction(productId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  await prisma.product.deleteMany({
    where: { id: productId, sellerId: session.user.id },
  });

  revalidatePath("/dashboard/seller/listings");
  return { success: true };
}
