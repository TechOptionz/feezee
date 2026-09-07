import { defineConfig, env } from "prisma/config";
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
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
