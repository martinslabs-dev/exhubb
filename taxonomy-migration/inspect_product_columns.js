require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const { Client } = require('pg');

(async ()=>{
  const conn = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!conn) { console.error('No DIRECT_URL/DATABASE_URL in .env'); process.exit(2); }
  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    console.log('Connected to DB');
    const q = `SELECT column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='Product' ORDER BY ordinal_position`;
    const res = await client.query(q);
    console.log('Columns for public.Product:');
    for (const r of res.rows) console.log('- ' + r.column_name + ' (' + r.data_type + ')');

    const sample = await client.query('SELECT * FROM public."Product" LIMIT 5');
    console.log('\nSample rows (up to 5):');
    console.log(JSON.stringify(sample.rows,null,2));

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message || err);
    try { await client.end(); } catch(_){}
    process.exit(1);
  }
})();
