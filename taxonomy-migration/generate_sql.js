#!/usr/bin/env node
// Generates SQL INSERT statements for every node in taxonomy.json
// Usage: node generate_sql.js > categories_inserts.sql

const fs = require('fs');
const path = require('path');

const taxonomy = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'taxonomy.json'), 'utf8'));

let statements = [];

function esc(s) {
  return (s || '').replace(/'/g, "''");
}

function walk(nodes, parentId = null, depth = 0) {
  nodes.forEach((n) => {
    const id = n.id || n.slug || ('cat_' + Math.random().toString(36).slice(2,9));
    const name = esc(n.name || id);
    const slug = esc(n.slug || id);
    const parent = parentId ? `'${esc(parentId)}'` : 'NULL';
    const depthVal = depth;
    const meta = n.meta ? JSON.stringify(n.meta).replace(/'/g, "''") : '{}';
    statements.push(`INSERT INTO categories (id, name, slug, parent_id, depth, meta) VALUES ('${id}', '${name}', '${slug}', ${parent}, ${depthVal}, '${meta}') ON CONFLICT (id) DO NOTHING;`);
    if (n.children && n.children.length) walk(n.children, id, depth + 1);
  });
}

walk(taxonomy.topLevel || []);

console.log('-- Generated categories inserts from taxonomy.json');
console.log('BEGIN;');
console.log(statements.join('\n'));
console.log('COMMIT;');

console.error('Wrote', statements.length, 'insert statements to stdout');
