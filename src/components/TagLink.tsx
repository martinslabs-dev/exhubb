"use client";

import Link from "next/link";

"use client";

import { useRouter } from "next/navigation";
import React from "react";

export default function TagLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        router.push(href);
      }}
      className={className}
    >
      {children}
    </button>
  );
}
