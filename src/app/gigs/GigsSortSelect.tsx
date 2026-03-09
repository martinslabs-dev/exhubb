"use client";

import { useRouter } from "next/navigation";

interface Props {
  q: string;
  category: string;
  sort: string;
}

export default function GigsSortSelect({ q, category, sort }: Props) {
  const router = useRouter();

  function handleChange(value: string) {
    const params = new URLSearchParams();
    if (q)        params.set("q",        q);
    if (category) params.set("category", category);
    params.set("sort", value);
    router.push(`/gigs?${params.toString()}`);
  }

  return (
    <select
      defaultValue={sort}
      onChange={(e) => handleChange(e.target.value)}
      className="h-9 px-3 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 outline-none focus:border-primary-400 transition-colors"
    >
      <option value="newest">Newest first</option>
      <option value="popular">Most popular</option>
      <option value="price_asc">Price: low to high</option>
      <option value="price_desc">Price: high to low</option>
    </select>
  );
}
