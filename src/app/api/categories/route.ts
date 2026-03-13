import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import fs from "fs";
import path from "path";

async function readRepoMenu() {
  try {
    const file = path.join(process.cwd(), "taxonomy-migration", "categories_menu.json");
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, "utf8");
      const data = JSON.parse(raw);
      return data.menu ?? [];
    }
  } catch (e) {
    // ignore
  }
  return [];
}

// GET /api/categories
export async function GET(req: Request) {
  const url = new URL(req.url);
  const forceMenu = url.searchParams.get("menu") === "1";

  // If caller explicitly asked for the menu shape, return repo menu immediately
  if (forceMenu) {
    const menu = await readRepoMenu();
    return NextResponse.json({ menu }, { status: 200 });
  }

  try {
    // Attempt to read categories table (created by migration scripts).
    const rows: Array<any> = await prisma.$queryRaw`
      SELECT id, name, slug, parent_id as parentId, depth, attribute_set_id as attributeSetId, meta
      FROM categories
      ORDER BY depth ASC, name ASC`;

    // Build tree
    const map = new Map();
    for (const r of rows) {
      map.set(r.id, { id: r.id, name: r.name, slug: r.slug, parentId: r.parentId, depth: r.depth, meta: r.meta || {}, children: [] });
    }
    const roots: any[] = [];
    for (const node of map.values()) {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    }

    return NextResponse.json({ categories: roots }, { status: 200 });
  } catch (err) {
    // On any error (table missing, DB down), return fallback menu JSON from repo
    const menu = await readRepoMenu();
    return NextResponse.json({ menu, categories: [] }, { status: 200 });
  }
}
