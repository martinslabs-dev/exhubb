import { PrismaClient } from "@prisma/client";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- keeps TS cache fresh after prisma generate
import type { } from "@prisma/client";

// Singleton — prevents hot-reload creating multiple connections in Next.js dev
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function makePrisma() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
  // Use DELETE journal mode so writes go straight to dev.db (no WAL sidecar)
  // This makes the SQLite Viewer always show live data
  if (process.env.NODE_ENV === "development") {
    client.$executeRawUnsafe("PRAGMA journal_mode=DELETE").catch(() => {});
  }
  return client;
}

export const prisma = globalForPrisma.prisma ?? makePrisma();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;


