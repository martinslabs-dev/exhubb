const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const { Client } = require('pg');

const conn = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!conn) { console.error('No DIRECT_URL/DATABASE_URL found in .env'); process.exit(2); }

const outDir = path.resolve(process.cwd(), 'taxonomy-migration');
const now = new Date().toISOString().slice(0,10);
const backups = {
  categories: path.join(outDir, `categories_backup_${now}.csv`),
  attribute_sets: path.join(outDir, `attribute_sets_backup_${now}.csv`),
  product_categories: path.join(outDir, `product_categories_backup_${now}.csv`)
};

(async ()=>{
  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    console.log('Connected to DB');

    // Check existence of tables
    const hasCategories = (await client.query("SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='categories' LIMIT 1")).rowCount > 0;
    const hasAttr = (await client.query("SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='attribute_sets' LIMIT 1")).rowCount > 0;

    // Backup categories if exists
    if (hasCategories) {
      const res = await client.query('SELECT * FROM public.categories');
      const rows = res.rows;
      if (rows.length) {
        const hdr = Object.keys(rows[0]).join(',');
        const lines = [hdr];
        for (const r of rows) {
          const vals = Object.keys(r).map(k => {
            const v = r[k];
            if (v === null || v === undefined) return '';
            const s = (typeof v === 'object') ? JSON.stringify(v) : String(v);
            return '"' + s.replace(/"/g,'""') + '"';
          }).join(',');
          lines.push(vals);
        }
        fs.writeFileSync(backups.categories, lines.join('\n'));
        console.log('Wrote categories backup to', backups.categories);
      } else {
        fs.writeFileSync(backups.categories, '');
        console.log('Categories table empty — wrote empty backup:', backups.categories);
      }
    } else {
      console.log('No categories table found; skipping categories backup.');
    }

    // Backup attribute_sets if exists
    if (hasAttr) {
      const res = await client.query('SELECT * FROM public.attribute_sets');
      const rows = res.rows;
      if (rows.length) {
        const hdr = Object.keys(rows[0]).join(',');
        const lines = [hdr];
        for (const r of rows) {
          const vals = Object.keys(r).map(k => {
            const v = r[k];
            if (v === null || v === undefined) return '';
            const s = (typeof v === 'object') ? JSON.stringify(v) : String(v);
            return '"' + s.replace(/"/g,'""') + '"';
          }).join(',');
          lines.push(vals);
        }
        fs.writeFileSync(backups.attribute_sets, lines.join('\n'));
        console.log('Wrote attribute_sets backup to', backups.attribute_sets);
      } else {
        fs.writeFileSync(backups.attribute_sets, '');
        console.log('Attribute_sets table empty — wrote empty backup:', backups.attribute_sets);
      }
    } else {
      console.log('No attribute_sets table found; skipping attribute_sets backup.');
    }

    // Backup product id + category
    const prodRes = await client.query('SELECT id, category FROM public."Product"');
    if (prodRes.rows.length) {
      const hdr = Object.keys(prodRes.rows[0]).join(',');
      const lines = [hdr];
      for (const r of prodRes.rows) {
        const vals = Object.keys(r).map(k => {
          const v = r[k];
          if (v === null || v === undefined) return '';
          const s = (typeof v === 'object') ? JSON.stringify(v) : String(v);
          return '"' + s.replace(/"/g,'""') + '"';
        }).join(',');
        lines.push(vals);
      }
      fs.writeFileSync(backups.product_categories, lines.join('\n'));
      console.log('Wrote product categories backup to', backups.product_categories);
    } else {
      fs.writeFileSync(backups.product_categories, '');
      console.log('No products found — wrote empty product backup:', backups.product_categories);
    }

    // Apply phone_accessories_upsert.sql
    const phoneSqlPath = path.join(outDir, 'phone_accessories_upsert.sql');
    if (!fs.existsSync(phoneSqlPath)) throw new Error('Missing ' + phoneSqlPath);
    const phoneSql = fs.readFileSync(phoneSqlPath, 'utf8');
    console.log('Applying', phoneSqlPath);
    await client.query(phoneSql);
    console.log('Applied', phoneSqlPath);

    // Apply categories_inserts.sql
    const catsSqlPath = path.join(outDir, 'categories_inserts.sql');
    if (!fs.existsSync(catsSqlPath)) throw new Error('Missing ' + catsSqlPath);
    const catsSql = fs.readFileSync(catsSqlPath, 'utf8');
    console.log('Applying', catsSqlPath);
    await client.query(catsSql);
    console.log('Applied', catsSqlPath);

    await client.end();
    console.log('Full taxonomy upsert completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error during full taxonomy apply:', err.message || err);
    try { await client.end(); } catch(_){}
    process.exit(1);
  }
})();
