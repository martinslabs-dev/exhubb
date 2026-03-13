import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers/Providers";
import Script from "next/script";

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
        {/* Basic structured data for site */}
        <Script id="jsonld-site" type="application/ld+json" strategy="afterInteractive">
          {`{
            "@context": "https://schema.org",
            "@type": "WebSite",
            "url": "${process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://www.example.com'}",
            "name": "Exhubb",
            "potentialAction": {"@type": "SearchAction", "target": "${process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://www.example.com'}/search?q={search_term_string}", "query-input": "required name=search_term_string"}
          }`}
        </Script>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
