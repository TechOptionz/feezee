import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  AdminHeading,
  EmptyRow,
  Panel,
  TableWrap,
  Td,
  Th,
} from "@/app/admin/admin-ui";
import { toggleArchiveAction } from "@/app/actions/admin";
import { requireStaff } from "@/modules/admin";
import { prisma } from "@/lib/prisma";
import { toAed } from "@/modules/shared/money";
import { img } from "@/lib/assets";
import { formatPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Products" };
export const dynamic = "force-dynamic";

const COLLECTIONS = ["Printed Lawn", "Luxury Pret", "Ready to Wear", "Sale"];

export default async function AdminProductsPage({
  searchParams,
}: PageProps<"/admin/products">) {
  await requireStaff("/admin/products");

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const collection = typeof params.collection === "string" ? params.collection : "";
  const stock = typeof params.stock === "string" ? params.stock : "";
  const archived = params.archived === "1";

  const rows = await prisma.product.findMany({
    where: {
      isArchived: archived,
      ...(collection ? { collection } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { slug: { contains: q, mode: "insensitive" as const } },
              { fabric: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: true,
    },
    orderBy: { id: "asc" },
  });

  // Stock is a property of the variants, not a column, so this one filter is
  // applied after the query rather than inside it.
  const products = rows.filter((product) => {
    if (!stock) return true;
    const total = product.variants.reduce((n, v) => n + v.stock, 0);
    const low = product.variants.some((v) => v.stock > 0 && v.stock <= v.lowStockThreshold);
    if (stock === "out") return total === 0;
    if (stock === "low") return low;
    return total > 0;
  });

  return (
    <>
      <AdminHeading
        title="Products"
        standfirst="The catalogue the shop reads. Archiving a piece takes it off the site without deleting what it has already sold."
        action={
          <Link
            href="/admin/products/new"
            className="border-none bg-gold px-6 py-3 text-[12px] tracking-[0.16em] uppercase text-ink hover:text-ink"
          >
            New product
          </Link>
        }
      />

      <Panel>
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-2">
            <span className="text-[11px] tracking-[0.16em] uppercase text-taupe">
              Search
            </span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Name, slug or fabric"
              className="min-w-[220px] border border-ink-line bg-transparent px-3 py-2.5 text-[14px] text-champagne outline-none placeholder:text-taupe focus:border-gold"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-[11px] tracking-[0.16em] uppercase text-taupe">
              Line
            </span>
            <select
              name="collection"
              defaultValue={collection}
              className="border border-ink-line bg-ink px-3 py-2.5 text-[14px] text-champagne outline-none focus:border-gold"
            >
              <option value="">All lines</option>
              {COLLECTIONS.map((line) => (
                <option key={line} value={line}>
                  {line}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-[11px] tracking-[0.16em] uppercase text-taupe">
              Stock
            </span>
            <select
              name="stock"
              defaultValue={stock}
              className="border border-ink-line bg-ink px-3 py-2.5 text-[14px] text-champagne outline-none focus:border-gold"
            >
              <option value="">Any</option>
              <option value="in">In stock</option>
              <option value="low">Running low</option>
              <option value="out">Sold out</option>
            </select>
          </label>

          <label className="flex items-center gap-2.5 pb-2.5 text-[13.5px] text-sandstone cursor-pointer">
            <input
              type="checkbox"
              name="archived"
              value="1"
              defaultChecked={archived}
              className="w-[15px] h-[15px] accent-[var(--fz-gold)] cursor-pointer"
            />
            Archived only
          </label>

          <button
            type="submit"
            className="cursor-pointer border border-ink-border bg-transparent px-5 py-2.5 text-[11.5px] tracking-[0.16em] uppercase text-sandstone hover:border-champagne hover:text-champagne"
          >
            Filter
          </button>

          {(q || collection || stock || archived) && (
            <Link
              href="/admin/products"
              className="pb-2.5 text-[11.5px] tracking-[0.14em] uppercase text-taupe hover:text-champagne"
            >
              Clear
            </Link>
          )}
        </form>
      </Panel>

      <div className="mt-4">
        <Panel title={`${products.length} ${products.length === 1 ? "piece" : "pieces"}`}>
          <TableWrap>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>Piece</Th>
                  <Th>Line</Th>
                  <Th>Price</Th>
                  <Th>Sizes in stock</Th>
                  <Th align="right">Total stock</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <EmptyRow span={6}>Nothing matches that.</EmptyRow>
                ) : (
                  products.map((product) => {
                    const total = product.variants.reduce((n, v) => n + v.stock, 0);
                    const live = product.variants.filter((v) => v.stock > 0).length;

                    return (
                      <tr key={product.id}>
                        <Td>
                          <span className="flex items-center gap-3">
                            <span className="relative block h-[48px] w-[38px] shrink-0 overflow-hidden bg-ink-line">
                              {product.images[0] && (
                                <Image
                                  src={img(product.images[0].url)}
                                  alt=""
                                  fill
                                  sizes="38px"
                                  className="object-cover object-top"
                                />
                              )}
                            </span>
                            <span className="min-w-0">
                              <Link
                                href={`/admin/products/${product.id}`}
                                className="block text-champagne hover:text-gold-light"
                              >
                                {product.name}
                              </Link>
                              <span className="block text-[12px] text-taupe">
                                {product.fabric}
                              </span>
                            </span>
                          </span>
                        </Td>
                        <Td>{product.collection}</Td>
                        <Td>
                          {formatPrice(toAed(product.aed))}
                          {product.wasAed && (
                            <span className="ml-2 text-taupe line-through">
                              {formatPrice(toAed(product.wasAed))}
                            </span>
                          )}
                        </Td>
                        <Td>
                          <span
                            className={cn(
                              live === 0 && "text-wine-bright",
                              live > 0 && live <= 2 && "text-gold-light",
                            )}
                          >
                            {live} of {product.variants.length}
                          </span>
                        </Td>
                        <Td align="right">{total}</Td>
                        <Td align="right">
                          <span className="flex justify-end gap-4">
                            <Link
                              href={`/admin/products/${product.id}`}
                              className="text-[11.5px] tracking-[0.14em] uppercase text-gold-light hover:text-champagne"
                            >
                              Edit
                            </Link>
                            <form action={toggleArchiveAction}>
                              <input
                                type="hidden"
                                name="productId"
                                value={product.id}
                              />
                              <button
                                type="submit"
                                className="cursor-pointer border-none bg-transparent p-0 text-[11.5px] tracking-[0.14em] uppercase text-taupe hover:text-wine-bright"
                              >
                                {product.isArchived ? "Restore" : "Archive"}
                              </button>
                            </form>
                          </span>
                        </Td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      </div>
    </>
  );
}
