import type { Metadata } from "next";
import Link from "next/link";
import {
  AdminHeading,
  EmptyRow,
  Panel,
  TableWrap,
  Td,
  Th,
  adminDateTime,
} from "@/app/admin/admin-ui";
import { auditEntityTypes, listAuditLogs, requireStaff } from "@/modules/admin";

export const metadata: Metadata = { title: "Audit log" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 60;

export default async function AdminAuditLogPage({
  searchParams,
}: PageProps<"/admin/audit-logs">) {
  await requireStaff("/admin/audit-logs");

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const entityType = typeof params.entityType === "string" ? params.entityType : "";
  const page = Math.max(1, Number(params.page) || 1);

  const [{ logs, total }, types] = await Promise.all([
    listAuditLogs({
      search: q || undefined,
      entityType: entityType || undefined,
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    auditEntityTypes(),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <AdminHeading
        title="Audit log"
        standfirst="Who changed what, and when. Written for every stock adjustment, order transition, return decision and catalogue edit."
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
              placeholder="Email, action or entity id"
              className="min-w-[240px] border border-ink-line bg-transparent px-3 py-2.5 text-[14px] text-champagne outline-none placeholder:text-taupe focus:border-gold"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-[11px] tracking-[0.16em] uppercase text-taupe">
              Entity
            </span>
            <select
              name="entityType"
              defaultValue={entityType}
              className="border border-ink-line bg-ink px-3 py-2.5 text-[14px] text-champagne outline-none focus:border-gold"
            >
              <option value="">Anything</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="cursor-pointer border border-ink-border bg-transparent px-5 py-2.5 text-[11.5px] tracking-[0.16em] uppercase text-sandstone hover:border-champagne hover:text-champagne"
          >
            Filter
          </button>

          {(q || entityType) && (
            <Link
              href="/admin/audit-logs"
              className="pb-2.5 text-[11.5px] tracking-[0.14em] uppercase text-taupe hover:text-champagne"
            >
              Clear
            </Link>
          )}
        </form>
      </Panel>

      <div className="mt-4">
        <Panel title={`${total} ${total === 1 ? "entry" : "entries"}`}>
          <TableWrap>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>When</Th>
                  <Th>Who</Th>
                  <Th>Action</Th>
                  <Th>Entity</Th>
                  <Th>Change</Th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <EmptyRow span={5}>Nothing logged yet.</EmptyRow>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <Td>
                        <span className="whitespace-nowrap">
                          {adminDateTime(log.createdAt)}
                        </span>
                        {log.ipAddress && (
                          <span className="block text-[11px] text-taupe">
                            {log.ipAddress}
                          </span>
                        )}
                      </Td>
                      <Td>{log.userEmail}</Td>
                      <Td>
                        <span className="text-champagne">{log.action}</span>
                      </Td>
                      <Td>
                        {log.entityType}
                        <span className="block text-[11.5px] text-taupe">
                          {log.entityId}
                        </span>
                      </Td>
                      <Td>
                        <Diff before={log.previousState} after={log.newState} />
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableWrap>

          {pages > 1 && (
            <div className="mt-5 flex items-center justify-between gap-4 text-[12px] tracking-[0.14em] uppercase">
              {page > 1 ? (
                <Link
                  href={`/admin/audit-logs?page=${page - 1}`}
                  className="text-gold-light hover:text-champagne"
                >
                  ← Previous
                </Link>
              ) : (
                <span className="text-taupe/50">← Previous</span>
              )}
              <span className="text-taupe">
                Page {page} of {pages}
              </span>
              {page < pages ? (
                <Link
                  href={`/admin/audit-logs?page=${page + 1}`}
                  className="text-gold-light hover:text-champagne"
                >
                  Next →
                </Link>
              ) : (
                <span className="text-taupe/50">Next →</span>
              )}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

/**
 * The state diff, as `field: before → after`.
 *
 * Only fields that actually changed, because an entry listing fifteen unchanged
 * values is one nobody reads. A field present in only one of the two sides
 * still shows, with an em dash for the side it is missing from.
 */
function Diff({ before, after }: { before: unknown; after: unknown }) {
  const a = asRecord(before);
  const b = asRecord(after);
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];

  const changed = keys.filter(
    (key) => JSON.stringify(a[key]) !== JSON.stringify(b[key]),
  );

  if (changed.length === 0) {
    return <span className="text-taupe">—</span>;
  }

  return (
    <ul className="m-0 p-0 list-none flex flex-col gap-0.5 text-[12.5px]">
      {changed.map((key) => (
        <li key={key}>
          <span className="text-taupe">{key}:</span>{" "}
          {key in a ? (
            <span className="text-taupe line-through">{show(a[key])}</span>
          ) : (
            <span className="text-taupe">—</span>
          )}
          <span className="text-taupe"> → </span>
          <span className="text-sandstone">{key in b ? show(b[key]) : "—"}</span>
        </li>
      ))}
    </ul>
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function show(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "yes" : "no";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > 42 ? `${text.slice(0, 42)}…` : text;
}
