"use client";

import { useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductImageGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? null;

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="aspect-square bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
        {current ? (
          <Image
            key={current}
            src={current}
            alt={title}
            fill
            className="object-cover transition-opacity duration-200"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority={active === 0}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-20 h-20 text-gray-200" />
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative w-16 h-16 shrink-0 rounded-xl border-2 overflow-hidden transition-all focus:outline-none",
                i === active ? "border-primary-500 scale-105 shadow-md" : "border-gray-200 hover:border-primary-300"
              )}
            >
              <Image src={src} alt={`${title} ${i + 1}`} fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
