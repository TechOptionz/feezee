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
import { SaleControls, SalePill } from "@/app/admin/products/sale-controls";
import { requireStaff } from "@/modules/admin";
import { prisma } from "@/lib/prisma";
import { toAed, toAedOrNull } from "@/modules/shared/money";
import { img } from "@/lib/assets";
import { formatPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Products" };
export const dynamic = "force-dynamic";

const COLLECTIONS = ["Printed Lawn", "Luxury Pret", "Ready to Wear", "Sale"];

/**
 * The three views of the catalogue a buyer running a sale switches between.
 * `param` is what goes in the URL, `value` is what the page reads back out of
 * it — an empty string for "All", which carries no parameter at all.
 */
const SALE_TABS = [
  { param: "", value: "", label: "All" },
  { param: "1", value: "on", label: "On sale" },
  { param: "0", value: "off", label: "Full price" },
] as const;

export default async function AdminProductsPage({
  searchParams,
}: PageProps<"/admin/products">) {
  await requireStaff("/admin/products");

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const collection = typeof params.collection === "string" ? params.collection : "";
  const stock = typeof params.stock === "string" ? params.stock : "";
  const archived = params.archived === "1";
  // "1" is the reduced rail, "0" is everything still at its first price, and
  // anything else — including no parameter at all — is the whole catalogue.
  const sale = params.sale === "1" ? "on" : params.sale === "0" ? "off" : "";

  /** The same filters with the sale tab swapped, so the tabs keep a search. */
  const tabHref = (value: string) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (collection) next.set("collection", collection);
    if (stock) next.set("stock", stock);
    if (archived) next.set("archived", "1");
    if (value) next.set("sale", value);
    const query = next.toString();
    return query ? `/admin/products?${query}` : "/admin/products";
  };

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

  /*
   * Two filters the query cannot do. Stock is a property of the variants
   * rather than a column, and "on sale" is one column measured against another
   * — both are cheap on the rows already in hand, and both would otherwise
   * need either a join or a raw comparison in SQL.
   */
  const products = rows.filter((product) => {
    if (sale) {
      const reduced =
        product.wasAed !== null && toAed(product.wasAed) > toAed(product.aed);
      if (sale === "on" ? !reduced : reduced) return false;
    }
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
        <nav className="mb-4 flex flex-wrap gap-x-6 gap-y-2 border-b border-ink-line pb-3">
          {SALE_TABS.map((tab) => (
            <Link
              key={tab.label}
              href={tabHref(tab.param)}
              aria-current={tab.value === sale ? "page" : undefined}
              className={cn(
                "border-b-2 pb-1 text-[11.5px] tracking-[0.16em] uppercase",
                tab.value === sale
                  ? "border-gold text-champagne"
                  : "border-transparent text-taupe hover:text-champagne",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <form method="get" className="flex flex-wrap items-end gap-3">
          {/* The tab lives in the URL, and this form rewrites the URL out of
              its own fields — without this the chosen tab would fall off the
              moment anyone pressed Filter. */}
          {sale && (
            <input type="hidden" name="sale" value={sale === "on" ? "1" : "0"} />
          )}

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

          {(q || collection || stock || archived || sale) && (
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
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span>{formatPrice(toAed(product.aed))}</span>
                            {product.wasAed && (
                              <span className="text-taupe line-through">
                                {formatPrice(toAed(product.wasAed))}
                              </span>
                            )}
                            <SalePill
                              aed={toAed(product.aed)}
                              wasAed={toAedOrNull(product.wasAed)}
                            />
                          </span>
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
                          {/* On its own line under the two links: putting a
                              piece on sale opens a panel, and that needs the
                              width of the cell rather than a slot in a row. */}
                          <span className="mt-2 flex justify-end">
                            <SaleControls
                              productId={product.id}
                              aed={toAed(product.aed)}
                              wasAed={toAedOrNull(product.wasAed)}
                            />
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
