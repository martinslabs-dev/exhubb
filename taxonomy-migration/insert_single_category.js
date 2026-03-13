require('dotenv').config(); const { Client } = require('pg');
(async ()=>{
  const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
  await client.connect();
  try {
    const q = `INSERT INTO categories (id, name, slug, parent_id, depth, meta) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`;
    const vals = ['phones-tablets','Phones & Tablets','phones-tablets', null, 0, '{}'];
    await client.query(q, vals);
    console.log('inserted via params');
  } catch (err) { console.error('err', err.message); }
  await client.end();
})();
