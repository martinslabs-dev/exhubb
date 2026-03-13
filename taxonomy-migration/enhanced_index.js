#!/usr/bin/env node
// Enhanced product -> category mapper with synonyms and confidence scoring
// Usage: node enhanced_index.js input.json output.json

const fs = require('fs');
const path = require('path');

const INPUT = process.argv[2] || 'sample_products.json';
const OUTPUT = process.argv[3] || 'mapped_products.json';

const taxonomy = require('./taxonomy.json');

// Flatten taxonomy to leaf slugs
function flatten(nodes) {
  const out = [];
  (nodes || []).forEach(n => {
    const item = { id: n.id, name: n.name, slug: n.slug };
    out.push(item);
    if (n.children) out.push(...flatten(n.children));
  });
  return out;
}

const flat = flatten(taxonomy.topLevel || []);
const leafSlugs = new Set(flat.map(f => f.slug));

// synonyms and keyword map (extend as needed)
const synonyms = {
  'cell phone': 'smartphones',
  'mobile phone': 'smartphones',
  'smart phone': 'smartphones',
  'power bank': 'batteries-powerbanks',
  'battery pack': 'batteries-powerbanks',
  'charger': 'chargers-cables',
  'usb-c': 'chargers-cables',
  'screen protector': 'cases-screen-protectors',
  'phone case': 'cases-screen-protectors',
  'earbud': 'audio',
  'earphone': 'audio'
};

const rules = [
  { pattern: /(iphone|galaxy|tecno|xiaomi|itel|infinix|samsung|nokia)/i, slug: 'smartphones', weight: 1.0 },
  { pattern: /(charger|usb\s*-?c|power bank|wall charger)/i, slug: 'chargers-cables', weight: 0.95 },
  { pattern: /(earbud|earphone|headset|headphone|airpod|tws)/i, slug: 'audio', weight: 0.9 },
  { pattern: /(memory card|micro ?sd|sd card|usb flash)/i, slug: 'memory-cards', weight: 0.9 },
  { pattern: /(case|cover|screen protector|tempered)/i, slug: 'cases-screen-protectors', weight: 0.9 },
  { pattern: /(refurbished)/i, slug: 'refurbished-phones', weight: 0.85 },
  { pattern: /(tablet|ipad)/i, slug: 'tablets', weight: 0.9 }
];

function scoreMatch(text, product) {
  let best = { slug: null, score: 0, reasons: [] };
  const t = (text || '').toLowerCase();

  // synonyms
  for (const [k, v] of Object.entries(synonyms)) {
    if (t.includes(k)) {
      best = { slug: v, score: Math.max(best.score, 0.85), reasons: [...best.reasons, `synonym:${k}`] };
    }
  }

  // rules
  for (const r of rules) {
    if (r.pattern.test(text)) {
      const s = r.weight + (product.tags && product.tags.length ? 0.02 : 0);
      if (s > best.score) best = { slug: r.slug, score: s, reasons: [...best.reasons, `rule:${r.slug}`] };
    }
  }

  // brand hint
  if (product.brand && /iphone|samsung|xiaomi|tecno|itel|infinix/i.test(product.brand)) {
    if (best.score < 0.6) best = { slug: 'smartphones', score: 0.7, reasons: [...best.reasons, `brand:${product.brand}`] };
  }

  // fallback to 'other'
  if (!best.slug) best = { slug: 'other', score: 0.25, reasons: ['fallback'] };
  return best;
}

const products = JSON.parse(fs.readFileSync(path.resolve(INPUT), 'utf8'));

const mapped = products.map(p => {
  const text = [p.title || '', p.description || '', (p.tags || []).join(' ')].join(' ');
  const r = scoreMatch(text, p);
  return Object.assign({}, p, { mapped_category: r.slug, confidence: Number(r.score.toFixed(2)), reasons: r.reasons });
});

const summary = mapped.reduce((acc, m) => { acc[m.mapped_category] = (acc[m.mapped_category] || 0) + 1; return acc; }, {});

fs.writeFileSync(path.resolve(OUTPUT), JSON.stringify({ mapped, summary }, null, 2));
console.log('Mapped', mapped.length, 'products ->', OUTPUT);
