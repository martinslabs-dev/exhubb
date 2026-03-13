require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const { Client } = require('pg');
const fs = require('fs');

const conn = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!conn) { console.error('No DIRECT_URL/DATABASE_URL found in .env'); process.exit(2); }

const keywords = ['phone','mobile','smartphone','redmi','xiaomi','samsung','iphone','itel','tecno','itel','infinix','oppo','tecno','itel','vivo','motorola'];

(async ()=>{
  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    const q = `SELECT id, title, description, tags, category FROM public."Product" WHERE category = 'Electronics'`;
    const res = await client.query(q);
    const candidates = [];
    for (const r of res.rows) {
      const text = [r.title, r.description, (r.tags||[]).join(' ')].join(' ').toLowerCase();
      let score = 0;
      const hits = [];
      for (const k of keywords) {
        if (text.includes(k)) { score += 1; hits.push(k); }
      }
      if (score > 0) {
        const confidence = Math.min(1, score / 6);
        candidates.push({ id: r.id, title: r.title, oldCategory: r.category, suggestedCategory: 'Phones & Accessories', hits, confidence });
      }
    }
    const out = 'taxonomy-migration/phone_mapping_preview.json';
    fs.writeFileSync(out, JSON.stringify(candidates, null, 2));
    console.log('Wrote preview to', out, '—', candidates.length, 'candidates');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message || err);
    try { await client.end(); } catch(_){}
    process.exit(1);
  }
})();
