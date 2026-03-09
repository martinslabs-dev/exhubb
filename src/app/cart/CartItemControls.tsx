"use client";

import { useState, useTransition } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { updateCartItemAction, removeFromCartAction } from "@/lib/actions/cart";

interface Props {
  cartItemId: string;
  quantity: number;
  stock: number;
}

export default function CartItemControls({ cartItemId, quantity, stock }: Props) {
  const [qty, setQty]           = useState(quantity);
  const [isPending, startTransition] = useTransition();

  function handleChange(newQty: number) {
    if (newQty < 0) return;
    setQty(newQty);
    startTransition(async () => {
      if (newQty === 0) {
        await removeFromCartAction(cartItemId);
      } else {
        await updateCartItemAction(cartItemId, newQty);
      }
    });
  }

  if (qty === 0) return null;

  return (
    <div className="flex flex-col items-end gap-2 shrink-0">
      {/* quantity controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleChange(qty - 1)}
          disabled={isPending}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-6 text-center text-sm font-semibold text-gray-800">{qty}</span>
        <button
          onClick={() => handleChange(qty + 1)}
          disabled={isPending || qty >= stock}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      {/* remove */}
      <button
        onClick={() => handleChange(0)}
        disabled={isPending}
        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
      >
        <Trash2 className="w-3 h-3" /> Remove
      </button>
    </div>
  );
}
