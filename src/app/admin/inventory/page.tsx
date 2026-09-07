import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeading, Panel, StatCard } from "@/app/admin/admin-ui";
import { InventoryTable, type InventoryRow } from "@/app/admin/inventory/inventory-table";
import { requireStaff } from "@/modules/admin";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Inventory" };
export const dynamic = "force-dynamic";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

export default async function AdminInventoryPage({
  searchParams,
}: PageProps<"/admin/inventory">) {
  await requireStaff("/admin/inventory");

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const filter = typeof params.filter === "string" ? params.filter : "";

  const variants = await prisma.productVariant.findMany({
    where: q
      ? {
          product: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
            ],
          },
        }
      : {},
    include: { product: true },
    orderBy: [{ product: { name: "asc" } }],
  });

  const all: InventoryRow[] = variants
    .map((variant) => ({
      variantId: variant.id,
      productId: variant.productId,
      productName: variant.product.name,
      collection: variant.product.collection,
      size: variant.size,
      sku: variant.sku,
      stock: variant.stock,
      lowStockThreshold: variant.lowStockThreshold,
      isArchived: variant.product.isArchived,
    }))
    .sort(
      (a, b) =>
        a.productName.localeCompare(b.productName) ||
        SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size),
    );

  const rows =
    filter === "low"
      ? all.filter((r) => r.stock > 0 && r.stock <= r.lowStockThreshold)
      : filter === "out"
        ? all.filter((r) => r.stock === 0)
        : filter === "attention"
          ? all.filter((r) => r.stock <= r.lowStockThreshold)
          : all;

  const live = all.filter((r) => !r.isArchived);
  const outCount = live.filter((r) => r.stock === 0).length;
  const lowCount = live.filter(
    (r) => r.stock > 0 && r.stock <= r.lowStockThreshold,
  ).length;
  const units = live.reduce((n, r) => n + r.stock, 0);

  return (
    <>
      <AdminHeading
        title="Inventory"
        standfirst="Every size of every piece. Click a number to recount it — each change is written to the ledger with a reason and the balance it left behind."
      />

      <div className="grid grid-cols-2 nav:grid-cols-4 gap-3">
        <StatCard label="Pieces on the rail" value={String(units)} />
        <StatCard label="Sizes tracked" value={String(live.length)} />
        <StatCard
          label="Running low"
          value={String(lowCount)}
          tone={lowCount > 0 ? "warn" : "default"}
          href="/admin/inventory?filter=low"
        />
        <StatCard
          label="Sold out"
          value={String(outCount)}
          tone={outCount > 0 ? "warn" : "default"}
          href="/admin/inventory?filter=out"
        />
      </div>

      <div className="mt-4">
        <Panel>
          <form method="get" className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-2">
              <span className="text-[11px] tracking-[0.16em] uppercase text-taupe">
                Search
              </span>
              <input
                name="q"
                defaultValue={q}
                placeholder="Piece name"
                className="min-w-[220px] border border-ink-line bg-transparent px-3 py-2.5 text-[14px] text-champagne outline-none placeholder:text-taupe focus:border-gold"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[11px] tracking-[0.16em] uppercase text-taupe">
                Show
              </span>
              <select
                name="filter"
                defaultValue={filter}
                className="border border-ink-line bg-ink px-3 py-2.5 text-[14px] text-champagne outline-none focus:border-gold"
              >
                <option value="">Everything</option>
                <option value="attention">Needs attention</option>
                <option value="low">Running low</option>
                <option value="out">Sold out</option>
              </select>
            </label>

            <button
              type="submit"
              className="cursor-pointer border border-ink-border bg-transparent px-5 py-2.5 text-[11.5px] tracking-[0.16em] uppercase text-sandstone hover:border-champagne hover:text-champagne"
            >
              Filter
            </button>

            {(q || filter) && (
              <Link
                href="/admin/inventory"
                className="pb-2.5 text-[11.5px] tracking-[0.14em] uppercase text-taupe hover:text-champagne"
              >
                Clear
              </Link>
            )}
          </form>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel title={`${rows.length} ${rows.length === 1 ? "size" : "sizes"}`}>
          <InventoryTable rows={rows} />
        </Panel>
      </div>
    </>
  );
}
