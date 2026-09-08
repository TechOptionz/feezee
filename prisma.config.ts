import { defineConfig } from "prisma/config";
import "dotenv/config";

/**
 * Prisma 7 moved the connection URL out of `schema.prisma`.
 *
 * The schema now declares only the provider; the URL the CLI uses for
 * `db push`, `migrate` and `studio` lives here, and the URL the *runtime* uses
 * is handed to `PrismaClient` through the pg driver adapter in
 * `src/lib/prisma.ts`. Two places, one environment variable.
 *
 * Prisma 7 also stopped reading `.env` on its own, hence the dotenv import —
 * without it every CLI command would see an undefined DATABASE_URL.
 *
 * DIRECT_URL wins when it is set. Supabase's pooler answers on two ports: 6543
 * runs pgbouncer in transaction mode, which is what the serverless runtime
 * wants but cannot carry DDL, and 5432 is a plain session pooler, which can.
 * The CLI is the side that issues DDL, so it takes the direct URL.
 *
 * The datasource is omitted entirely when neither variable is set. It is
 * optional to Prisma for everything except migration and introspection, and
 * `postinstall` on a build host runs `prisma generate` before any environment
 * is wired up — reading a missing variable eagerly there would abort the
 * install with `PrismaConfigEnvError` instead of generating the client.
 */
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  ...(url ? { datasource: { url } } : {}),
});
