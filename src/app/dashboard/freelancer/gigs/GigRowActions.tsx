"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { toggleGigActiveAction, deleteGigAction } from "@/lib/actions/gig";

interface GigRowActionsProps {
  gigId: string;
  isActive: boolean;
}

export default function GigRowActions({ gigId, isActive }: GigRowActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleToggle() {
    setBusy(true);
    await toggleGigActiveAction(gigId);
    router.refresh();
    setBusy(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this gig? This cannot be undone.")) return;
    setBusy(true);
    await deleteGigAction(gigId);
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
    </>
  );
}
