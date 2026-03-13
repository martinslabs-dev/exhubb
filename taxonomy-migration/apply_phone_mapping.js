require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const fs = require('fs');
const { Client } = require('pg');

const PREVIEW = 'taxonomy-migration/phone_mapping_preview.json';
const BACKUP = `taxonomy-migration/phone_mapping_backup_${new Date().toISOString().slice(0,10)}.csv`;
const THRESHOLD = parseFloat(process.argv[2]) || 0.6;

const conn = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!conn) { console.error('No DIRECT_URL/DATABASE_URL in .env'); process.exit(2); }

(async ()=>{
  const client = new Client({ connectionString: conn });
  await client.connect();
  console.log('Connected to DB');

  if (!fs.existsSync(PREVIEW)) {
    console.error('Preview file not found:', PREVIEW); await client.end(); process.exit(1);
  }
  const preview = JSON.parse(fs.readFileSync(PREVIEW,'utf8'));
  const toApply = preview.filter(p => p.confidence >= THRESHOLD);
  console.log(`Found ${preview.length} preview items, ${toApply.length} >= ${THRESHOLD}`);
  if (!toApply.length) { await client.end(); process.exit(0); }

  // Prepare backup CSV headers from first selected row
  const backupLines = [];
  let headerWritten = false;

  try {
    await client.query('BEGIN');
    for (const item of toApply) {
      const res = await client.query('SELECT * FROM public."Product" WHERE id = $1', [item.id]);
      if (!res.rows.length) { console.warn('Row not found for id', item.id); continue; }
      const row = res.rows[0];
      if (!headerWritten) {
        const hdr = Object.keys(row).join(',');
        backupLines.push(hdr);
        headerWritten = true;
      }
      const vals = Object.keys(row).map(k => {
        const v = row[k];
        if (v === null || v === undefined) return '';
        const s = (typeof v === 'object') ? JSON.stringify(v) : String(v);
        return '"' + s.replace(/"/g,'""') + '"';
      }).join(',');
      backupLines.push(vals);

      // Update category
      const newCat = 'Phones & Accessories';
      await client.query('UPDATE public."Product" SET category = $1, "updatedAt" = now() WHERE id = $2', [newCat, item.id]);
      console.log('Updated', item.id, '->', newCat);
    }
    await client.query('COMMIT');

    fs.writeFileSync(BACKUP, backupLines.join('\n'));
    console.log('Wrote backup to', BACKUP);
  } catch (err) {
    console.error('Error during apply, rolling back:', err.message || err);
    try { await client.query('ROLLBACK'); } catch(_){}
    await client.end();
    process.exit(1);
  }

  await client.end();
  process.exit(0);
})();
