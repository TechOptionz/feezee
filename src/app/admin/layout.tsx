import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { AdminNav } from "@/app/admin/admin-nav";
import { ACTION } from "@/app/admin/admin-ui";
import { adminLogoutAction } from "@/app/actions/admin";
import { currentActor } from "@/modules/admin";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · FEEZEE Admin" },
  robots: { index: false, follow: false, nocache: true },
};

/*
 * The back office's text face, loaded here rather than in the root layout so
 * the shop never fetches it. The variable it defines is read by `.fz-admin`
 * in globals.css and by the `font-admin` utility.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

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
    return (
      <div className={cn("fz-admin min-h-screen bg-cream text-sandstone", inter.variable)}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fz-admin min-h-screen bg-cream text-sandstone print:min-h-0 print:bg-white print:text-black",
        inter.variable,
      )}
    >
      {/*
        The shell fills the window: the rail sits on the left edge and stays
        put while the page scrolls, and the content takes whatever is left.
        Only the content itself is capped — a table stretched across a
        27-inch monitor is harder to read than one that stops at 1480px.
      */}
      <div className="flex min-h-screen w-full flex-col nav:flex-row print:block print:min-h-0">
        <aside className="print:hidden shrink-0 border-b border-ink-line bg-sand/45 nav:sticky nav:top-0 nav:h-screen nav:w-[232px] nav:overflow-y-auto nav:border-b-0 nav:border-r">
          <div className="flex items-center justify-between gap-4 px-5 py-5 nav:block">
            <Link href="/admin" className="block">
              <span className="block font-display text-[20px] leading-none tracking-[0.22em] uppercase text-champagne">
                FEEZEE
              </span>
              <span className="mt-2 block text-[11px] font-medium tracking-[0.22em] uppercase text-taupe">
                Back office
              </span>
            </Link>

            <Link
              href="/"
              className={cn(ACTION, "text-taupe hover:text-champagne nav:hidden")}
            >
              Shop ↗
            </Link>
          </div>

          <AdminNav />

          <div className="hidden nav:block border-t border-ink-line px-5 py-5">
            <Link href="/" className={cn(ACTION, "text-taupe hover:text-champagne")}>
              View the shop ↗
            </Link>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="print:hidden flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-ink-line px-[clamp(16px,2.4vw,32px)] py-4">
            <div className="min-w-0">
              <div className="truncate text-[14px] font-medium text-champagne">
                {actor.name}
              </div>
              <div className="mt-0.5 truncate text-[12px] text-taupe">
                <span className="font-medium tracking-[0.1em] uppercase">
                  {actor.role === "ADMIN" ? "Administrator" : "Staff"}
                </span>
                {" · "}
                {actor.email}
              </div>
            </div>

            <form action={adminLogoutAction}>
              <button
                type="submit"
                className={cn(
                  ACTION,
                  "cursor-pointer border border-ink-border bg-transparent px-4 py-2 text-sandstone hover:border-champagne hover:text-champagne",
                )}
              >
                Sign out
              </button>
            </form>
          </header>

          <main className="px-[clamp(16px,2.4vw,32px)] py-[clamp(20px,3vw,36px)] print:p-0">
            <div className="max-w-[1480px] print:max-w-none">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
