#!/usr/bin/env node
// prisma_upsert.js
// Upsert taxonomy into your database using Prisma Client.
// Usage:
// 1) Dry run (no writes): node prisma_upsert.js
// 2) Apply changes: node prisma_upsert.js --apply
// Run this from your project root (where Prisma Client is configured).

const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');

function log(...a){ console.log('[taxonomy-upsert]', ...a); }

(async function main(){
  const taxonomyPath = path.resolve(__dirname, 'taxonomy.json');
  if(!fs.existsSync(taxonomyPath)){
    console.error('taxonomy.json not found in taxonomy-migration/. Create or copy it there.');
    process.exit(1);
  }

  const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'));
  let attributeSets = {};
  const attrPath = path.resolve(__dirname, 'attribute_sets.json');
  if(fs.existsSync(attrPath)){
    attributeSets = JSON.parse(fs.readFileSync(attrPath, 'utf8'));
  }

  // Load Prisma Client from host project
  let PrismaClient;
  try {
    PrismaClient = require('@prisma/client').PrismaClient;
  } catch (err) {
    console.error('Could not load @prisma/client. Install and run `npx prisma generate` first.');
    console.error('If your project uses a different prisma client path, run this script from your project root.');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try{
    // Upsert attribute sets
    const attrIds = Object.keys(attributeSets);
    log('Attribute sets found:', attrIds.length);
    for(const id of attrIds){
      const set = attributeSets[id];
      if(!APPLY){
        log('DRY:', 'attributeSet upsert', id, set.name);
        continue;
      }
      await prisma.attributeSet.upsert({
        where: { id },
        create: { id, name: set.name, schema: set },
        update: { name: set.name, schema: set }
      });
      log('Upserted attributeSet:', id);
    }

    // Upsert categories in top-down order
    const slugToId = {};
    async function processNodes(nodes, parentId = null, depth = 0){
      for(const n of nodes || []){
        const id = n.id || n.slug;
        const slug = n.slug || id;
        const name = n.name || slug;
        const attributeSetId = n.attribute_set_id || null;
        const meta = n.meta || {};

        if(!APPLY){
          log('DRY:', 'category upsert', slug, 'parent=', parentId, 'depth=', depth, attributeSetId ? `attr=${attributeSetId}` : '');
        } else {
          // Prisma model and field names assumed: Category(id, name, slug, parentId, depth, attributeSetId, meta)
          // If your Prisma schema differs, adapt the field names below.
          await prisma.category.upsert({
            where: { id },
            create: {
              id,
              name,
              slug,
              parentId,
              depth,
              attributeSetId,
              meta
            },
            update: {
              name,
              slug,
              parentId,
              depth,
              attributeSetId,
              meta
            }
          });
          log('Upserted category:', slug);
        }

        slugToId[slug] = id;
        if(n.children && n.children.length) await processNodes(n.children, id, depth+1);
      }
    }

    await processNodes(taxonomy.topLevel || []);

    if(APPLY){
      log('Completed upsert. Disconnecting...');
    } else {
      log('Dry run complete. To apply changes run with --apply');
    }

    await prisma.$disconnect();
  } catch (err) {
    console.error('Error during upsert:', err);
    try { await prisma.$disconnect(); } catch(e){}
    process.exit(1);
  }
})();
