/**
 * One-shot: set any NULL or duplicate `reference` values in
 * WalletTransaction to the row's own `id`.
 * Run with:  node scripts/dedup-references.mjs
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve } from "path";

// Parse .env.local for DB credentials
function loadEnv(filePath) {
  const env = {};
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    env[key] = val;
  }
  return env;
}

const env = loadEnv(resolve(process.cwd(), ".env.local"));

// Pass URL directly — bypasses Prisma's own .env loading
const prisma = new PrismaClient({
  datasources: { db: { url: env.DATABASE_URL } },
});

async function main() {
  const all = await prisma.walletTransaction.findMany({
    select: { id: true, reference: true },
    orderBy: { createdAt: "asc" },
  });

  const seen = new Set();
  let fixed = 0;

  for (const tx of all) {
    const needsFix = !tx.reference || seen.has(tx.reference);
    if (needsFix) {
      await prisma.walletTransaction.update({
        where: { id: tx.id },
        data:  { reference: tx.id },
      });
      fixed++;
      console.log(`Fixed tx ${tx.id}  (was: ${tx.reference ?? "NULL"})`);
    } else {
      seen.add(tx.reference);
    }
  }

  console.log(`\nDone — fixed ${fixed} / ${all.length} rows.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
