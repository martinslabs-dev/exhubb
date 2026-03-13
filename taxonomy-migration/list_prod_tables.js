require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const { Client } = require('pg');

(async ()=>{
  const conn = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!conn) { console.error('No DIRECT_URL/DATABASE_URL in .env'); process.exit(2); }
  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    console.log('Connected to DB');
    const q = `SELECT table_schema, table_name
               FROM information_schema.tables
               WHERE table_type='BASE TABLE'
                 AND table_schema NOT IN ('pg_catalog','information_schema')
               ORDER BY table_schema, table_name`;
    const res = await client.query(q);
    for (const r of res.rows) console.log(r.table_schema + '.' + r.table_name);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Error listing tables:', err.message || err);
    try { await client.end(); } catch(_){}
    process.exit(1);
  }
})();
