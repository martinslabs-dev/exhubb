"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

const OPTIONS = [
  { value: "newest",     label: "Newest" },
  { value: "oldest",     label: "Oldest" },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
];

export default function SortSelect({ current }: { current: string }) {
  const router = useRouter();
  const params = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(params.toString());
    next.set("sort", e.target.value);
    next.delete("page"); // reset to page 1 when sort changes
    router.push(`/products?${next.toString()}`);
  }

  return (
    <div className="relative">
      <select
        value={current}
        onChange={handleChange}
        className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
    </div>
  );
}
