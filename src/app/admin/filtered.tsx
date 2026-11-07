import { Suspense } from "react";
import AdminLoading from "@/app/admin/loading";

export type SearchParams = Record<string, string | string[] | undefined>;

/**
 * The loading boundary that a filter actually crosses.
 *
 * `loading.tsx` wraps the page in a Suspense boundary, but that boundary lives
 * at the segment, and a filter, a date tab or a page number does not change
 * the segment — only the query string. React keeps a boundary that has already
 * shown content on screen while its replacement renders, so a filter click
 * left the old table up, unchanged, for the whole round trip to a database a
 * few hundred milliseconds away. It looked like nothing had happened.
 *
 * This puts a second boundary *inside* the page, keyed on the query string.
 * A new key is a new boundary, and a new boundary shows its fallback at once,
 * so the skeleton paints as soon as the server's first chunk arrives — which
 * needs no database — and the data streams into it afterwards.
 *
 * Awaiting `searchParams` here is cheap: it is the request, not a query.
 */
export async function Filtered({
  searchParams,
  children,
}: {
  searchParams: Promise<SearchParams>;
  children: (params: SearchParams) => React.ReactNode;
}) {
  const params = await searchParams;
  return (
    <Suspense key={keyOf(params)} fallback={<AdminLoading />}>
      {children(params)}
    </Suspense>
  );
}

/** The query string with its keys in a fixed order, so `?a=1&b=2` and `?b=2&a=1` are one view. */
function keyOf(params: SearchParams): string {
  return Object.keys(params)
    .sort()
    .map((key) => `${key}=${String(params[key] ?? "")}`)
    .join("&");
}
