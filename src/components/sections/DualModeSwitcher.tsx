import DualModeSwitcherClient from "./DualModeSwitcherClient";
import taxonomy from "@/lib/taxonomy.json";
import { prisma } from "@/lib/db";

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/,"")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/,"")}K`;
  return String(n);
}

export default async function DualModeSwitcher() {
  // Aggregate product counts by category (top-level headings)
  let productGroups: { category: string | null; _count: { id: number } }[] = [];
  let gigGroups: { category: string | null; _count: { id: number } }[] = [];
  try {
    productGroups = await prisma.product.groupBy({ by: ["category"], _count: { id: true } }) as any;
    gigGroups = await prisma.gig.groupBy({ by: ["category"], _count: { id: true } }) as any;
  } catch (err) {
    // Log and continue with empty groups so the homepage doesn't crash
    // during database outages or local dev without DB access.
    // eslint-disable-next-line no-console
    console.error("DualModeSwitcher: failed to load product/gig groups", err);
    productGroups = [];
    gigGroups = [];
  }

  const prodMap = new Map<string, number>();
  productGroups.forEach((g) => prodMap.set(g.category ?? "", g._count.id));
  const gigMap = new Map<string, number>();
  gigGroups.forEach((g) => gigMap.set(g.category ?? "", g._count.id));

  // Build product headings from taxonomy (Physical + Digital)
  const physical = taxonomy.menu.find((m: any) => m.title.toLowerCase().includes("physical"));
  const digital = taxonomy.menu.find((m: any) => m.title.toLowerCase().includes("digital"));

  const productItems: { icon?: string; name: string; count: string; href?: string }[] = [];
  if (physical && physical.columns) {
    for (const col of physical.columns.slice(0, 6)) {
      const heading = col.heading;
      const cnt = prodMap.get(heading) ?? 0;
      productItems.push({ icon: heading.includes("Electronics") ? "Monitor" : undefined, name: heading, count: `${formatCount(cnt)} listings`, href: `/products?category=${encodeURIComponent(heading)}` });
    }
  }

  // For services show top gig categories
  const topGigs = Array.from(gigMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const serviceItems = topGigs.map(([name, cnt]) => ({ icon: name.toLowerCase().includes("design") ? "Palette" : undefined, name, count: `${formatCount(cnt)} freelancers`, href: `/gigs?category=${encodeURIComponent(name)}` }));

  // Fallbacks if nothing found
  if (productItems.length === 0) {
    productItems.push({ icon: "Monitor", name: "Electronics", count: "0 listings", href: "/products?category=Electronics" });
  }
  if (serviceItems.length === 0) {
    serviceItems.push({ icon: "Palette", name: "Design & Creative", count: "0 freelancers", href: "/gigs?category=Design%20%26%20Creative" });
  }

  return <DualModeSwitcherClient productItems={productItems} serviceItems={serviceItems} />;
}
