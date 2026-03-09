import type { Metadata } from "next";
import Link from "next/link";
import AuthAnimationPanel from "@/components/auth/AuthAnimationPanel";
import ExhubbLogo from "@/components/ExhubbLogo";

export const metadata: Metadata = {
  title: { template: "%s · Exhubb", default: "Auth · Exhubb" },
  description: "Sign in or create your Exhubb account.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — animated brand showcase (lg+) ─────────── */}
      <aside className="hidden lg:block lg:w-[44%] xl:w-[48%] fixed inset-y-0 left-0">
        <AuthAnimationPanel />
      </aside>

      {/* ── Right panel — form area ──────────────────────────────── */}
      <div className="flex-1 lg:ml-[44%] xl:ml-[48%] flex flex-col min-h-screen">
        {/* Mobile-only top bar */}
        <header className="lg:hidden h-14 flex items-center px-5 border-b border-gray-100 bg-white flex-shrink-0">
          <Link href="/" className="inline-flex items-center">
            <ExhubbLogo variant="full" size={28} noAnimate />
          </Link>
        </header>

        {/* Desktop logo inside form panel */}
        <div className="hidden lg:flex items-center px-8 pt-8 pb-0">
          <Link href="/" className="inline-flex items-center">
            <ExhubbLogo variant="full" size={28} noAnimate />
          </Link>
        </div>

        {/* Page content */}
        <main className="flex-1 flex items-center justify-center px-5 sm:px-8 py-8">
          <div className="w-full max-w-md">{children}</div>
        </main>

        {/* Footer */}
        <footer className="flex-shrink-0 flex items-center justify-center gap-4 py-5 text-xs text-gray-400 border-t border-gray-100">
          <span>© {new Date().getFullYear()} Exhubb</span>
          <span>·</span>
          <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
        </footer>
      </div>
    </div>
  );
}
