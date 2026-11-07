/**
 * What a click shows while the page it asked for is still on its way.
 *
 * Every admin page is rendered on demand (`force-dynamic`) against a database
 * a hundred milliseconds away (§4.21), so a sidebar link, a filter or a date
 * tab is a few hundred milliseconds of nothing without this. With a loading
 * boundary in place Next paints the shell at once — and prefetches it when a
 * link scrolls into view — so the click is answered before the data arrives.
 *
 * The shapes echo a typical page: a title, a row of figures, a panel of rows.
 * Grey blocks on the admin's raised ground; no text, nothing that could be
 * mistaken for a number.
 */
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-pulse">
      <div className="mb-[clamp(20px,2.6vw,32px)]">
        <div className="h-9 w-56 max-w-full bg-admin-raised" />
        <div className="mt-4 h-4 w-[min(560px,100%)] bg-admin-raised/70" />
      </div>

      <div className="grid grid-cols-2 nav:grid-cols-3 min-[1560px]:grid-cols-6 gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="border border-ink-line bg-admin-surface p-[clamp(16px,2.2vw,22px)]">
            <div className="h-3 w-20 bg-admin-raised" />
            <div className="mt-4 h-7 w-28 bg-admin-raised" />
          </div>
        ))}
      </div>

      <div className="mt-4 border border-ink-line bg-admin-surface p-[clamp(16px,2.2vw,24px)]">
        <div className="mb-4 h-3 w-24 border-b border-ink-line pb-6 bg-admin-raised" />
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex gap-6 border-b border-ink-line/70 py-4">
            <div className="h-4 w-28 bg-admin-raised" />
            <div className="h-4 w-40 bg-admin-raised/70" />
            <div className="hidden h-4 w-24 bg-admin-raised/70 sm:block" />
            <div className="ml-auto h-4 w-20 bg-admin-raised" />
          </div>
        ))}
      </div>
    </div>
  );
}
