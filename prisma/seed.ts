import "dotenv/config";
import { PrismaClient, Prisma, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import {
  products,
  productImages,
  productSku,
  productSlug,
} from "../src/content/products";
import {
  SIZES,
  productDetail,
  sizeOptions,
} from "../src/content/product-detail";
import {
  DEFAULT_SETTINGS,
  SETTING_DESCRIPTIONS,
  type StoreSettings,
} from "../src/modules/shared/store-policy";

/**
 * Migrates the design-time catalogue into the database.
 *
 * `src/content/products.ts` and `src/content/product-detail.ts` were the shop's
 * source of truth while it was a showcase. They stay in the repo as the seed
 * input — this script is the one-way door that turns them into rows, after
 * which the database is what the shop reads.
 *
 * Idempotent, and deliberately asymmetric about stock: catalogue copy is
 * overwritten on every run so a corrected description propagates, but `stock`
 * is only ever set when a variant is first created. Re-seeding must never undo
 * a morning of counting on the shop floor.
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set — copy .env.example to .env first.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

/** Opening stock for a size, from the state the design file recorded. */
const OPENING_STOCK: Record<string, number> = {
  in: 12,
  /** At or under the default low-stock threshold, so the alert fires on day one. */
  low: 2,
  out: 0,
};

const ADMIN_EMAIL = "admin@feezee.ae";
const ADMIN_PASSWORD = "FeezeeAdmin2026!";

function dec(aed: number): Prisma.Decimal {
  return new Prisma.Decimal(aed.toFixed(2));
}

async function seedSettings() {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.storeSetting.upsert({
      where: { key },
      create: {
        key,
        value,
        description: SETTING_DESCRIPTIONS[key as keyof StoreSettings],
      },
      // Left alone on purpose: if the shop has changed its VAT rate in the
      // admin, re-seeding must not put it back.
      update: {},
    });
  }
  console.log(`  settings      ${Object.keys(DEFAULT_SETTINGS).length} keys`);
}

async function seedAdmin() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      name: "FEEZEE Administrator",
      passwordHash,
      role: Role.ADMIN,
    },
    // Never silently reset a password that has been changed in production.
    update: { role: Role.ADMIN },
  });
  console.log(`  admin         ${ADMIN_EMAIL}`);
}

async function seedCatalogue() {
  let variantCount = 0;
  let imageCount = 0;

  for (const product of products) {
    const detail = productDetail(product);
    const slug = productSlug(product);
    const images = productImages(product);

    const data = {
      slug,
      name: product.name,
      fabric: product.fabric,
      fabricFamily: product.fabricFamily,
      type: product.type,
      pieces: product.pieces,
      withDupatta: product.withDupatta,
      collection: product.collection,
      aed: dec(product.aed),
      wasAed: product.wasAed ? dec(product.wasAed) : null,
      badgeLabel: product.badge?.label ?? null,
      badgeTone: product.badge?.tone ?? null,
      cut: detail.cut,
      colour: detail.colour,
      description: detail.description,
      careInstructions: detail.care,
    };

    // The catalogue id is carried over rather than regenerated: the design
    // files, the boutique rail and the lookbook all still reference it.
    const row = await prisma.product.upsert({
      where: { id: product.id },
      create: { id: product.id, ...data },
      update: data,
    });

    // Images are replaced wholesale — they are an ordered list, and diffing
    // one against the design file would be more code than rewriting it.
    await prisma.productImage.deleteMany({ where: { productId: row.id } });
    await prisma.productImage.createMany({
      data: images.map((url, i) => ({
        productId: row.id,
        url,
        alt: i === 0 ? product.name : `${product.name} — view ${i + 1}`,
        sortOrder: i,
        isFeatured: i === 0,
      })),
    });
    imageCount += images.length;

    const states = new Map(sizeOptions(product).map((o) => [o.size, o.state]));
    const sku = productSku(product);

    for (const size of SIZES) {
      const state = states.get(size) ?? "in";
      await prisma.productVariant.upsert({
        where: { productId_size: { productId: row.id, size } },
        create: {
          productId: row.id,
          size,
          colour: detail.colour,
          sku: `${sku}-${size}`,
          stock: OPENING_STOCK[state] ?? 0,
          lowStockThreshold: 3,
        },
        // Stock is absent here on purpose. See the note at the top.
        update: { colour: detail.colour, sku: `${sku}-${size}` },
      });
      variantCount += 1;
    }
  }

  // Postgres does not know the autoincrement sequence has been jumped past by
  // the explicit ids above, so the first admin-created product would collide
  // with id 1. Nudge the sequence to the top of what we just inserted.
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Product"', 'id'), COALESCE((SELECT MAX(id) FROM "Product"), 1))`,
  );

  console.log(`  products      ${products.length}`);
  console.log(`  images        ${imageCount}`);
  console.log(`  variants      ${variantCount}`);
}

/**
 * Order numbers come from a Postgres sequence rather than `max(...) + 1`, so
 * two checkouts in the same instant cannot collide. Created here because it is
 * not something the Prisma schema can express.
 */
async function seedOrderSequence() {
  await prisma.$executeRawUnsafe(
    `CREATE SEQUENCE IF NOT EXISTS feezee_order_number START WITH 1001 INCREMENT BY 1`,
  );
  console.log("  order numbers from FZ-__-1001");
}

async function main() {
  console.log("Seeding FEEZEE…");
  await seedOrderSequence();
  await seedSettings();
  await seedAdmin();
  await seedCatalogue();

  const lowStock = await prisma.productVariant.count({
    where: { stock: { gt: 0, lte: 3 } },
  });
  const soldOut = await prisma.productVariant.count({ where: { stock: 0 } });
  console.log(`  low stock     ${lowStock} variants`);
  console.log(`  sold out      ${soldOut} variants`);
  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
