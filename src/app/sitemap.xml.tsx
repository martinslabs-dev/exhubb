import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

async function generateGigsUrls() {
  try {
    const gigs = await prisma.gig.findMany({ select: { id: true, updatedAt: true }, where: { isActive: true } });
    return gigs.map((g: any) => ({ loc: `/gigs/${g.id}`, lastmod: g.updatedAt?.toISOString() }));
  } catch (e) {
    return [];
  }
}

async function generateProductsUrls() {
  try {
    const products = await prisma.product.findMany({ select: { id: true, updatedAt: true }, where: { isActive: true } });
    return products.map((p: any) => ({ loc: `/products/${p.id}`, lastmod: p.updatedAt?.toISOString() }));
  } catch (e) {
    return [];
  }
}

async function generateFreelancerUrls() {
  try {
    const users = await prisma.user.findMany({ select: { id: true, updatedAt: true }, where: { isSeller: true } });
    return users.map((u: any) => ({ loc: `/freelancer/${u.id}`, lastmod: u.updatedAt?.toISOString() }));
  } catch (e) {
    return [];
  }
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.example.com";

  const staticRoutes = [
    { loc: "", priority: 1.0 },
    { loc: "gigs", priority: 0.9 },
    { loc: "products", priority: 0.9 },
    { loc: "", priority: 1.0 },
  ];

  const [gigs, products, sellers] = await Promise.all([
    generateGigsUrls(),
    generateProductsUrls(),
    generateFreelancerUrls(),
  ]);

  const all = [
    ...staticRoutes,
    ...gigs,
    ...products,
    ...sellers,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${all.map((r: any) => {
    const url = `${baseUrl}/${r.loc}`.replace(/([^:])\/\//g, "$1/");
    const lastmod = (r && r.lastmod) ? `<lastmod>${r.lastmod}</lastmod>` : "";
    const priority = (r && r.priority) ? `<priority>${r.priority}</priority>` : "";
    return `<url><loc>${url}</loc>${lastmod}${priority}</url>`;
  }).join("\n")}\n</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
