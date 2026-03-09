import { PrismaClient } from "@prisma/client";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- keeps TS cache fresh after prisma generate
import type { } from "@prisma/client";

// Singleton — prevents hot-reload creating multiple connections in Next.js dev
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function makePrisma() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
  return client;
}

export const prisma = globalForPrisma.prisma ?? makePrisma();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;


