"use client";

import { SessionProvider } from "next-auth/react";
import SmoothScrollProvider from "./SmoothScrollProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SmoothScrollProvider>
        {children}
      </SmoothScrollProvider>
    </SessionProvider>
  );
}
