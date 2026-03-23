import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalForPrisma = globalThis as unknown as { prisma: any };

function createPrismaClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaPg({ connectionString } as any);
  return new PrismaClient({ adapter });
}

export const prisma: InstanceType<typeof PrismaClient> =
  globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
