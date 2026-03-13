"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Trash2, MoreVertical } from "lucide-react";
import { toggleListingAction, deleteListingAction } from "@/lib/actions/listings";

interface ProductRowActionsProps {
  productId: string;
  isActive: boolean;
}

export default function ProductRowActions({ productId, isActive }: ProductRowActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleToggle() {
    setBusy(true);
    await toggleListingAction(productId, !isActive);
    router.refresh();
    setBusy(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    setBusy(true);
    await deleteListingAction(productId);
    router.refresh();
    setBusy(false);
  }

  return (
    <>
      <button
        onClick={handleToggle}
        disabled={busy}
        className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-40"
        title={isActive ? "Deactivate" : "Activate"}
      >
        {isActive
          ? <EyeOff className="w-3.5 h-3.5 text-gray-500" />
          : <Eye    className="w-3.5 h-3.5 text-gray-500" />}
      </button>
      <button
        onClick={handleDelete}
        disabled={busy}
        className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors disabled:opacity-40"
        title="Delete"
      >
        <Trash2 className="w-3.5 h-3.5 text-red-400" />
      </button>
      <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors" title="More">
        <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
      </button>
    </>
  );
}
