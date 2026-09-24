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

/**
 * The pool is tuned for a database that is far away, because it is.
 *
 * The hosted Postgres sits in Singapore; from the UAE, or from a Vercel
 * function in the US, one round trip is ~100 ms and opening a connection
 * (TCP, TLS, then the pooler's handshake) is ~500 ms. pg's defaults were
 * written for a database on the same rack: idle connections are dropped after
 * ten seconds, so every admin click after a short pause paid the full
 * handshake again — and a page that fires several queries in parallel paid it
 * once *per connection*, all at the same time. See PROJECT_MEMORY §4.21.
 *
 * - `idleTimeoutMillis`: keep warm connections for ten minutes, the length of
 *   a working session rather than a single click. Supabase's pooler is built
 *   to hold many idle client connections; that is what it is for.
 * - `keepAlive`: stop a NAT or load balancer from silently dropping an idle
 *   socket, which would surface as a slow failure on the next query.
 * - `max`: a page never needs more than a handful in flight, and each extra
 *   connection is another 500 ms handshake to pay on a cold start.
 * - `connectionTimeoutMillis`: fail loudly rather than hang if the pooler is
 *   unreachable.
 */
function createClient() {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      max: 6,
      idleTimeoutMillis: 10 * 60 * 1000,
      keepAlive: true,
      connectionTimeoutMillis: 10_000,
    }),
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
