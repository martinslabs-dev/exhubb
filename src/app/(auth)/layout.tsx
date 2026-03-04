import type { Metadata } from "next";
import Link from "next/link";
import ExhubbLogo from "@/components/ExhubbLogo";

export const metadata: Metadata = {
  title: { template: "%s · Exhubb", default: "Auth · Exhubb" },
  description: "Sign in or create your Exhubb account.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Minimal top bar */}
      <header className="h-14 flex items-center px-6 border-b border-gray-100 bg-white">
        <Link href="/" className="inline-flex items-center">
          <ExhubbLogo variant="full" size={32} noAnimate />
        </Link>
      </header>

      {/* Page content */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        {children}
      </main>

      {/* Minimal footer */}
      <footer className="h-12 flex items-center justify-center gap-4 text-xs text-gray-400 border-t border-gray-100 bg-white">
        <span>© {new Date().getFullYear()} Exhubb</span>
        <span>·</span>
        <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
        <span>·</span>
        <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
      </footer>
    </div>
  );
}
