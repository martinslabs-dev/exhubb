"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ─── Add item to cart (or increment quantity) ─────────────────
export async function addToCartAction(productId: string, quantity = 1) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true },
    select: { id: true, stock: true },
  });
  if (!product) return { error: "Product not found" };
  if (product.stock < 1) return { error: "Out of stock" };

  // Upsert cart
  const cart = await prisma.cart.upsert({
    where:  { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  });

  // Check existing item
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  if (existing) {
    const newQty = Math.min(existing.quantity + quantity, product.stock);
    await prisma.cartItem.update({
      where: { id: existing.id },
      data:  { quantity: newQty },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity },
    });
  }

  revalidatePath("/cart");
  revalidatePath(`/products/${productId}`);
  return { success: true };
}

// ─── Update quantity ──────────────────────────────────────────
export async function updateCartItemAction(cartItemId: string, quantity: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  if (quantity < 1) {
    return removeFromCartAction(cartItemId);
  }

  const item = await prisma.cartItem.findFirst({
    where: { id: cartItemId, cart: { userId: session.user.id } },
    include: { product: { select: { stock: true } } },
  });
  if (!item) return { error: "Item not found" };

  await prisma.cartItem.update({
    where: { id: cartItemId },
    data:  { quantity: Math.min(quantity, item.product.stock) },
  });

  revalidatePath("/cart");
  return { success: true };
}

// ─── Remove item ──────────────────────────────────────────────
export async function removeFromCartAction(cartItemId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  await prisma.cartItem.deleteMany({
    where: { id: cartItemId, cart: { userId: session.user.id } },
  });

  revalidatePath("/cart");
  return { success: true };
}

// ─── Clear entire cart ────────────────────────────────────────
export async function clearCartAction() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const cart = await prisma.cart.findUnique({ where: { userId: session.user.id } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  revalidatePath("/cart");
  return { success: true };
}

// ─── Get cart item count (for navbar badge) ───────────────────
export async function getCartCountAction(): Promise<number> {
  const session = await auth();
  if (!session?.user?.id) return 0;

  const result = await prisma.cartItem.aggregate({
    where: { cart: { userId: session.user.id } },
    _sum:  { quantity: true },
  });
  return result._sum.quantity ?? 0;
}
