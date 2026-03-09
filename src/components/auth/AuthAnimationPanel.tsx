"use client";

import dynamic from "next/dynamic";

const AuthAnimation = dynamic(() => import("./AuthAnimation"), { ssr: false });

export default function AuthAnimationPanel() {
  return <AuthAnimation />;
}
