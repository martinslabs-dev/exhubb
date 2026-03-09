"use client";

import { useState } from "react";
import { ShoppingCart, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { addToCartAction } from "@/lib/actions/cart";

interface Props {
  productId: string;
  stock: number;
  className?: string;
}

export default function AddToCartButton({ productId, stock, className }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg,   setMsg]   = useState("");

  async function handleClick() {
    if (stock < 1 || state === "loading") return;
    setState("loading");
    const res = await addToCartAction(productId);
    if (res.success) {
      setState("done");
      setTimeout(() => setState("idle"), 2500);
    } else {
      setState("error");
      setMsg(res.error ?? "Failed");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  const disabled = stock < 1 || state === "loading";

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all",
        state === "done"
          ? "bg-green-500 text-white"
          : state === "error"
          ? "bg-red-100 text-red-600 border border-red-200"
          : stock < 1
          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : "bg-gray-900 hover:bg-gray-700 text-white",
        className
      )}
    >
      {state === "loading" ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : state === "done" ? (
        <><Check className="w-4 h-4" /> Added!</>
      ) : state === "error" ? (
        msg || "Error"
      ) : (
        <><ShoppingCart className="w-4 h-4" /> Add to Cart</>
      )}
    </button>
  );
}
