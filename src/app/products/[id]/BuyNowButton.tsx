"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { addToCartAction } from "@/lib/actions/cart";

export default function BuyNowButton({ productId, stock, className }: { productId: string; stock: number; className?: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle"|"loading"|"error">("idle");

  async function handleBuyNow(e: React.MouseEvent) {
    e.preventDefault();
    if (stock < 1 || state === "loading") return;
    setState("loading");
    try {
      const res = await addToCartAction(productId, 1 as number);
      if (res?.success) {
        router.push('/checkout');
      } else {
        setState("error");
        setTimeout(() => setState("idle"), 2500);
      }
    } catch (err) {
      setState("error");
      setTimeout(() => setState("idle"), 2500);
    }
  }

  const disabled = stock < 1 || state === "loading";

  return (
    <button
      onClick={handleBuyNow}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-center py-3.5 rounded-xl font-bold text-sm transition-all",
        state === "loading" ? "bg-primary-500 text-white" : (stock < 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-primary-600 hover:bg-primary-700 text-white"),
        className
      )}
    >
      {state === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShoppingCart className="w-4 h-4" /> Buy Now</>}
    </button>
  );
}
