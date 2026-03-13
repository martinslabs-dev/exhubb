const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const { Client } = require('pg');

const sqlFile = process.argv[2] || 'taxonomy-migration/phone_accessories_upsert.sql';
const backupFile = process.argv[3] || `taxonomy-migration/categories_backup_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.csv`;

const conn = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!conn) {
  console.error('No DIRECT_URL or DATABASE_URL found in .env');
  process.exit(2);
}

(async function main(){
  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    console.log('Connected to DB');

    // Backup categories to CSV
    const res = await client.query('SELECT * FROM categories');
    const rows = res.rows;
    if (!rows.length) {
      console.log('No rows in categories table. Writing empty CSV with headers if possible.');
    }
    const header = rows.length ? Object.keys(rows[0]) : [];
    const csv = [header.join(',')];
    for (const r of rows) {
      const line = header.map(h => {
        const v = r[h];
        if (v === null || v === undefined) return '';
        const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
        return '"' + s.replace(/"/g,'""') + '"';
      }).join(',');
      csv.push(line);
    }
    fs.writeFileSync(backupFile, csv.join('\n'));
    console.log('Wrote backup:', backupFile);

    // Read and apply SQL
    const sql = fs.readFileSync(sqlFile, 'utf8');
    console.log('Applying SQL from', sqlFile);
    await client.query(sql);
    console.log('SQL applied successfully');

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    try { await client.end(); } catch(_){}
    process.exit(1);
  }
})();
