import type { Metadata } from "next";
import "./globals.css";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";

export const metadata: Metadata = {
  title: "Exhubb — Buy Products. Hire Talent. One Platform.",
  description:
    "Exhubb is the world's first unified marketplace for products and services. Shop millions of listings, hire top freelancers, and grow your income globally.",
  keywords: ["marketplace", "freelance", "buy", "sell", "services", "products", "global"],
  openGraph: {
    title: "Exhubb — Buy Products. Hire Talent. One Platform.",
    description: "Shop & sell products. Hire & offer services. All in one place.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#061a0e] text-white">
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
