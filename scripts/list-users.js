const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  // Force WAL checkpoint so SQLite Viewer can read the file
  await p.$executeRawUnsafe("PRAGMA wal_checkpoint(TRUNCATE)");

  const users = await p.user.findMany();
  if (users.length === 0) {
    console.log("No users found.");
  } else {
    users.forEach((u, i) => {
      console.log(`\n─── User ${i + 1} ───────────────────`);
      console.log(`  id          : ${u.id}`);
      console.log(`  name        : ${u.name}`);
      console.log(`  email       : ${u.email}`);
      console.log(`  isBuyer     : ${u.isBuyer}`);
      console.log(`  isSeller    : ${u.isSeller}`);
      console.log(`  isFreelancer: ${u.isFreelancer}`);
      console.log(`  createdAt   : ${u.createdAt}`);
      console.log(`  password    : [hashed — ${u.password ? u.password.substring(0,20) + "..." : "null"}]`);
    });
    console.log(`\nTotal: ${users.length} user(s)`);
  }
}

main().catch(console.error).finally(() => p.$disconnect());
