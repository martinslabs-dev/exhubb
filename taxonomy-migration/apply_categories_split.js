const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const { Client } = require('pg');

const conn = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!conn) { console.error('No DIRECT_URL/DATABASE_URL found in .env'); process.exit(2); }

(async ()=>{
  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    console.log('Connected to DB');
    const catsSqlPath = path.join(process.cwd(), 'taxonomy-migration', 'categories_inserts.sql');
    if (!fs.existsSync(catsSqlPath)) throw new Error('Missing ' + catsSqlPath);
    const content = fs.readFileSync(catsSqlPath, 'utf8');
    // Remove BEGIN/COMMIT lines then split by semicolon
    const cleaned = content.replace(/BEGIN;?/ig, '').replace(/COMMIT;?/ig, '');
    const parts = cleaned.split(/;\s*\n/).map(s=>s.trim()).filter(Boolean);
    for (const stmt of parts) {
      // skip empty
      if (!stmt) continue;
      await client.query(stmt + ';');
    }
    await client.end();
    console.log('Applied categories_inserts.sql via split execution');
    process.exit(0);
  } catch (err) {
    console.error('Error applying categories via split:', err.message || err);
    try { await client.end(); } catch(_){}
    process.exit(1);
  }
})();
