"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function toggleWishlistAction(
  productId: string
): Promise<{ wishlisted?: boolean; error?: string; requiresAuth?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { requiresAuth: true };

  const existing = await prisma.watchlistItem.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } },
  });

  if (existing) {
    await prisma.watchlistItem.delete({ where: { id: existing.id } });
    revalidatePath("/dashboard/buyer/watchlist");
    return { wishlisted: false };
  } else {
    await prisma.watchlistItem.create({
      data: { userId: session.user.id, productId },
    });
    revalidatePath("/dashboard/buyer/watchlist");
    return { wishlisted: true };
  }
}

export async function removeWatchlistItemAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const productId = formData.get("productId") as string;
  if (!productId) return;

  await prisma.watchlistItem.deleteMany({
    where: { userId: session.user.id, productId },
  });

  revalidatePath("/dashboard/buyer/watchlist");
}
