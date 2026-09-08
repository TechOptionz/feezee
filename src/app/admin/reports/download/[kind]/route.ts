import { notFound } from "next/navigation";
import { currentActor } from "@/modules/admin";
import { inventoryCsv, ordersCsv, salesCsv, resolveRange } from "@/modules/reporting";
import type { DateRange } from "@/modules/reporting";

/**
 * CSV downloads.
 *
 * A route handler rather than a server action, because the browser has to
 * receive a file: an action returns data to React, and turning that into a
 * download needs a Blob and a synthetic click. A `Content-Disposition` header
 * is what the platform already provides for this.
 *
 * Guarded like every other admin surface — a report URL is a data export, and
 * one that answered to anybody who guessed it would be a leak of every
 * customer's address.
 */
const KINDS = ["orders", "inventory", "sales"] as const;
type Kind = (typeof KINDS)[number];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  const actor = await currentActor();
  if (!actor) {
    return new Response("Not authorised", { status: 401 });
  }

  const { kind } = await params;
  if (!KINDS.includes(kind as Kind)) notFound();

  const url = new URL(request.url);
  const range = rangeFromSearch(url.searchParams);

  const csv =
    kind === "inventory"
      ? await inventoryCsv()
      : kind === "sales"
        ? await salesCsv(range)
        : await ordersCsv(range);

  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="feezee-${kind}-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

function rangeFromSearch(search: URLSearchParams): DateRange {
  const from = search.get("from");
  const to = search.get("to");

  if (from && to) {
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T23:59:59`);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      return { from: start, to: end };
    }
  }

  return resolveRange("Last 30 Days");
}
