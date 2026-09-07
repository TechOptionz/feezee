import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/app/admin/admin-nav";
import { adminLogoutAction } from "@/app/actions/admin";
import { currentActor } from "@/modules/admin";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · FEEZEE Admin" },
  robots: { index: false, follow: false, nocache: true },
};

/**
 * The back office.
 *
 * The guard is per page rather than here: this layout also wraps `/admin/login`,
 * and a layout that redirected unauthenticated visitors would bounce the login
 * page to itself forever. What it does instead is decide which chrome to draw —
 * the sidebar only exists once there is somebody to draw it for.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await currentActor();

  if (!actor) {
    return <div className="min-h-screen bg-ink text-sandstone">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-ink text-sandstone">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col nav:flex-row">
        <aside className="shrink-0 border-b border-ink-line nav:w-[232px] nav:border-b-0 nav:border-r">
          <div className="flex items-center justify-between gap-4 px-5 py-5 nav:block">
            <Link href="/admin" className="block">
              <span className="block font-display text-[20px] leading-none tracking-[0.22em] uppercase text-champagne">
                FEEZEE
              </span>
              <span className="mt-1.5 block text-[10.5px] tracking-[0.28em] uppercase text-taupe">
                Back office
              </span>
            </Link>

            <Link
              href="/"
              className="text-[11px] tracking-[0.16em] uppercase text-taupe hover:text-champagne nav:hidden"
            >
              Shop ↗
            </Link>
          </div>

          <AdminNav />

          <div className="hidden nav:block border-t border-ink-line px-5 py-5">
            <Link
              href="/"
              className="text-[11px] tracking-[0.16em] uppercase text-taupe hover:text-champagne"
            >
              View the shop ↗
            </Link>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-ink-line px-[clamp(16px,2.4vw,32px)] py-4">
            <div className="min-w-0">
              <div className="truncate text-[13.5px] text-champagne">
                {actor.name}
              </div>
              <div className="text-[11.5px] tracking-[0.14em] uppercase text-taupe">
                {actor.role === "ADMIN" ? "Administrator" : "Staff"} ·{" "}
                {actor.email}
              </div>
            </div>

            <form action={adminLogoutAction}>
              <button
                type="submit"
                className="cursor-pointer border border-ink-border bg-transparent px-4 py-2 text-[11.5px] tracking-[0.16em] uppercase text-sandstone hover:border-champagne hover:text-champagne"
              >
                Sign out
              </button>
            </form>
          </header>

          <main className="px-[clamp(16px,2.4vw,32px)] py-[clamp(20px,3vw,36px)]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
