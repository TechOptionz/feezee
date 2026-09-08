import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeading } from "@/app/admin/admin-ui";
import { ProductForm } from "@/app/admin/products/product-form";
import { requireStaff } from "@/modules/admin";
import { prisma } from "@/lib/prisma";
import { toAed, toAedOrNull } from "@/modules/shared/money";

export const metadata: Metadata = { title: "Edit product" };
export const dynamic = "force-dynamic";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

export default async function EditProductPage({
  params,
}: PageProps<"/admin/products/[id]">) {
  await requireStaff("/admin/products");

  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: true,
    },
  });
  if (!product) notFound();

  return (
    <>
      <AdminHeading
        title={product.name}
        standfirst={`/product/${product.slug}${product.isArchived ? " — archived, so the shop does not show it" : ""}`}
        action={
          !product.isArchived ? (
            <Link
              href={`/product/${product.slug}`}
              target="_blank"
              className="border border-ink-border px-5 py-2.5 text-[11.5px] tracking-[0.16em] uppercase text-sandstone hover:border-champagne hover:text-champagne"
            >
              View in shop ↗
            </Link>
          ) : undefined
        }
      />

      <ProductForm
        values={{
          id: product.id,
          name: product.name,
          fabric: product.fabric,
          fabricFamily: product.fabricFamily,
          type: product.type,
          pieces: product.pieces,
          withDupatta: product.withDupatta,
          collection: product.collection,
          aed: toAed(product.aed),
          wasAed: toAedOrNull(product.wasAed),
          badgeLabel: product.badgeLabel ?? "",
          badgeTone: product.badgeTone ?? "gold",
          cut: product.cut,
          colour: product.colour,
          description: product.description,
          careInstructions: product.careInstructions,
          isArchived: product.isArchived,
          images: product.images.map((image) => image.url),
          variants: [...product.variants]
            .sort(
              (a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size),
            )
            .map((variant) => ({
              id: variant.id,
              size: variant.size,
              sku: variant.sku,
              stock: variant.stock,
            })),
        }}
      />
    </>
  );
}
