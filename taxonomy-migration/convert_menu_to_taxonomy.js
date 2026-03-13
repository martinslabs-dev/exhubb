const fs = require('fs');
const path = require('path');

const menuPath = path.join(__dirname, 'categories_menu.json');
const outPath = path.join(__dirname, 'taxonomy.json');

if (!fs.existsSync(menuPath)) {
  console.error('categories_menu.json not found');
  process.exit(1);
}

const raw = fs.readFileSync(menuPath, 'utf8');
const data = JSON.parse(raw);
const menu = data.menu || [];

function normalizeItem(it) {
  return {
    id: it.slug || it.title.replace(/\s+/g, '-').toLowerCase(),
    name: it.title,
    slug: it.slug || it.title.replace(/\s+/g, '-').toLowerCase(),
    children: (it.children || []).map((c) => ({ id: c.slug || c.title.replace(/\s+/g, '-').toLowerCase(), name: c.title, slug: c.slug || c.title.replace(/\s+/g, '-').toLowerCase(), children: (c.children || []).map(cc => ({ id: cc.slug || cc.title.replace(/\s+/g, '-').toLowerCase(), name: cc.title, slug: cc.slug || cc.title.replace(/\s+/g, '-').toLowerCase() })) })),
  };
}

const topLevel = menu.flatMap((group) => {
  // group.columns[].items are top-level entries for this group
  const items = (group.columns || []).flatMap((col) => col.items || []);
  return items.map(normalizeItem);
});

const out = {
  name: 'Converted Taxonomy (from categories_menu.json)',
  version: '1.0',
  topLevel,
};

fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
console.log('Converted menu -> taxonomy.json with', topLevel.length, 'top-level items');
