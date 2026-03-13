require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

(async function(){
  const conn = process.env.DATABASE_URL;
  if (!conn) {
    console.error('DATABASE_URL not set in .env');
    process.exit(1);
  }
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Connected to DB');
    const res1 = await client.query('SELECT * FROM attribute_sets');
    const res2 = await client.query('SELECT * FROM categories');
    const outDir = path.resolve(__dirname, 'backups');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'attribute_sets_backup.json'), JSON.stringify(res1.rows, null, 2));
    fs.writeFileSync(path.join(outDir, 'categories_backup.json'), JSON.stringify(res2.rows, null, 2));
    console.log('Backups saved to taxonomy-migration/backups');
    await client.end();
  } catch (err) {
    console.error('Backup failed:', err.message || err);
    try { await client.end(); } catch(e){}
    process.exit(1);
  }
})();
