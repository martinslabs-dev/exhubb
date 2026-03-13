const fs = require('fs');
const path = require('path');
(async function(){
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    console.log('Connected, querying categories and attribute_sets...');
    const categories = await prisma.$queryRawUnsafe('SELECT * FROM categories');
    const attribute_sets = await prisma.$queryRawUnsafe('SELECT * FROM attribute_sets');
    const outDir = path.resolve(__dirname, 'backups');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
    fs.writeFileSync(path.join(outDir, 'categories_backup.json'), JSON.stringify(categories, null, 2));
    fs.writeFileSync(path.join(outDir, 'attribute_sets_backup.json'), JSON.stringify(attribute_sets, null, 2));
    console.log('Backups written to taxonomy-migration/backups');
    await prisma.$disconnect();
  } catch (err) {
    console.error('Backup failed:', err);
    process.exit(1);
  }
})();
