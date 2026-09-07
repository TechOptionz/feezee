import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * The one Prisma client the app uses.
 *
 * Cached on `globalThis` because Next's dev server re-evaluates modules on
 * every edit: without the cache each save would open a fresh connection pool
 * and Postgres would run out of connections within a few minutes of work.
 *
 * Prisma 7 takes its connection through a driver adapter rather than a `url`
 * in the schema, so the pool is pg's and the URL is read here.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env, then run `docker compose up -d`.",
  );
}

function createClient() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createClient>;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
