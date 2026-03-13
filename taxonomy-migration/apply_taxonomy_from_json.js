const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const { Client } = require('pg');

const conn = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!conn) { console.error('No DIRECT_URL/DATABASE_URL found in .env'); process.exit(2); }

const outDir = path.join(process.cwd(), 'taxonomy-migration');
const taxonomy = JSON.parse(fs.readFileSync(path.join(outDir,'taxonomy.json'),'utf8'));
let attributeSets = {};
try { attributeSets = JSON.parse(fs.readFileSync(path.join(outDir,'attribute_sets.json'),'utf8')); } catch(e) { attributeSets = {}; }

(async ()=>{
  const client = new Client({ connectionString: conn });
  await client.connect();
  console.log('Connected to DB');

  // Ensure tables exist
  await client.query(`CREATE TABLE IF NOT EXISTS attribute_sets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    schema JSONB NOT NULL
  );`);

  await client.query(`CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    depth INT DEFAULT 0,
    attribute_set_id TEXT REFERENCES attribute_sets(id),
    meta JSONB DEFAULT '{}'::jsonb
  );`);

  // Upsert attribute sets
  for (const [id, def] of Object.entries(attributeSets)){
    const schema = JSON.stringify(def);
    await client.query(`INSERT INTO attribute_sets (id, name, schema) VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, schema = EXCLUDED.schema`, [id, def.name || id, schema]);
    console.log('Upserted attribute_set', id);
  }

  // Recursive insert categories
  async function insertNode(node, parentId=null, depth=0){
    const attrId = attributeSets[node.id] ? node.id : null;
    const meta = JSON.stringify(node.meta || {});
    await client.query(
      `INSERT INTO categories (id, name, slug, parent_id, depth, attribute_set_id, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id, depth = EXCLUDED.depth, attribute_set_id = EXCLUDED.attribute_set_id, meta = EXCLUDED.meta`,
      [node.id, node.name, node.slug || node.id, parentId, depth, attrId, meta]
    );
    if (node.children && node.children.length){
      for (const c of node.children) await insertNode(c, node.id, depth+1);
    }
  }

  for (const top of taxonomy.topLevel){
    await insertNode(top, null, 0);
    console.log('Inserted top', top.id);
  }

  const cnt = (await client.query('SELECT count(*) FROM categories')).rows[0].count;
  console.log('Categories total:', cnt);

  await client.end();
  console.log('Taxonomy from JSON applied successfully');
  process.exit(0);
})();
