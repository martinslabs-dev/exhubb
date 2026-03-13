require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { Client } = require('pg');
(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Connected to DB');
    const dupRes = await client.query(`SELECT reference FROM "WalletTransaction" WHERE reference IS NOT NULL GROUP BY reference HAVING COUNT(*) > 1`);
    if (dupRes.rowCount === 0) {
      console.log('No duplicate references found');
      await client.end();
      return;
    }
    console.log('Found duplicate reference groups:', dupRes.rowCount);
    for (const row of dupRes.rows) {
      const ref = row.reference;
      const rows = await client.query('SELECT id FROM "WalletTransaction" WHERE reference = $1 ORDER BY "createdAt" ASC', [ref]);
      // leave first, update others
      for (let i = 1; i < rows.rows.length; i++) {
        const id = rows.rows[i].id;
        const newRef = `${ref}-${id}`;
        await client.query('UPDATE "WalletTransaction" SET reference = $1 WHERE id = $2', [newRef, id]);
        console.log('Updated', id, '->', newRef);
      }
    }
    await client.end();
    console.log('Duplicate references fixed');
  } catch (err) {
    console.error('Error fixing duplicates:', err);
    try { await client.end(); } catch(e){}
    process.exit(1);
  }
})();
