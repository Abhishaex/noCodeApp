import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | null };

function createPrisma(): PrismaClient | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }
  try {
    const adapter = new PrismaPg({ connectionString });
    return new PrismaClient({ adapter });
  } catch {
    return null;
  }
}

export const prisma: PrismaClient | null =
  globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}
