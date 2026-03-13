#!/usr/bin/env node
// Simple product -> category mapper using keyword rules.
// Usage: node index.js [input.json] [output.json]

const fs = require('fs');
const path = require('path');

const INPUT = process.argv[2] || 'sample_products.json';
const OUTPUT = process.argv[3] || 'mapped_products.json';

const taxonomy = require('./taxonomy.json');
const attributeSets = require('./attribute_sets.json');

const products = JSON.parse(fs.readFileSync(path.resolve(INPUT), 'utf8'));

// Simple rules: array of {pattern, category_slug, leaf}
const rules = [
  { pattern: /(iphone|galaxy|tecno|xiaomi|itel|infinix)/i, slug: 'smartphones' },
  { pattern: /(feature phone|basic phone|nokia\s*\d+)/i, slug: 'basic-phones' },
  { pattern: /(refurbished)/i, slug: 'refurbished-phones' },
  { pattern: /(rugged)/i, slug: 'rugged-phones' },
  { pattern: /(charger|usb\s*-?c|power bank|wall charger)/i, slug: 'chargers-cables' },
  { pattern: /(earbud|earphone|headset|headphone|airpod)/i, slug: 'audio' },
  { pattern: /(memory card|micro ?sd|sd card)/i, slug: 'memory-cards' },
  { pattern: /(case|cover|screen protector)/i, slug: 'cases-screen-protectors' },
  { pattern: /(ipad|tablet)/i, slug: 'tablets' }
];

function mapProduct(p) {
  const title = (p.title || '') + ' ' + (p.description || '') + ' ' + (p.tags || '').join(' ');
  let mapped = null;
  let confidence = 0;

  for (const r of rules) {
    if (r.pattern.test(title)) {
      mapped = r.slug;
      confidence = 0.9; // high confidence when we match rule
      break;
    }
  }

  if (!mapped) {
    // fallback by brand hint
    if (/charger|power bank|cable/i.test(title)) { mapped = 'chargers-cables'; confidence = 0.6; }
    else if (/case|cover|screen protector/i.test(title)) { mapped = 'cases-screen-protectors'; confidence = 0.6; }
    else mapped = 'other', confidence = 0.3;
  }

  return Object.assign({}, p, { mapped_category: mapped, confidence });
}

const mapped = products.map(mapProduct);
fs.writeFileSync(path.resolve(OUTPUT), JSON.stringify({ mapped, summary: {
  total: mapped.length,
  by_category: mapped.reduce((acc, m) => { acc[m.mapped_category] = (acc[m.mapped_category] || 0) + 1; return acc }, {})
}}, null, 2));

console.log('Mapped', mapped.length, 'products. Output:', OUTPUT);