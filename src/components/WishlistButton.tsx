"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleWishlistAction } from "@/lib/actions/wishlist";

interface Props {
  productId: string;
  initialWishlisted: boolean;
  /** "icon" = small circular overlay (for cards); "button" = full-width labelled button */
  variant?: "icon" | "button";
  className?: string;
}

export default function WishlistButton({
  productId,
  initialWishlisted,
  variant = "icon",
  className,
}: Props) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const res = await toggleWishlistAction(productId);
      if (res.requiresAuth) {
        router.push(`/login?callbackUrl=/products/${productId}`);
        return;
      }
      if (res.wishlisted !== undefined) {
        setWishlisted(res.wishlisted);
      }
    });
  }

  if (variant === "button") {
    return (
      <button
        onClick={handleClick}
        disabled={pending}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all disabled:opacity-60",
          wishlisted
            ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
            : "border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50 hover:text-red-500",
          className
        )}
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Heart
            className={cn(
              "w-4 h-4 transition-colors",
              wishlisted ? "fill-red-500 text-red-500" : "fill-transparent text-gray-400"
            )}
          />
        )}
        {wishlisted ? "Saved to Wishlist" : "Save to Wishlist"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      title={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
      className={cn(
        "w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center transition-all disabled:opacity-60 hover:scale-110",
        className
      )}
    >
      {pending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
      ) : (
        <Heart
          className={cn(
            "w-3.5 h-3.5 transition-colors",
            wishlisted ? "fill-red-500 text-red-500" : "fill-transparent text-gray-400 hover:text-red-400"
          )}
        />
      )}
    </button>
  );
}
