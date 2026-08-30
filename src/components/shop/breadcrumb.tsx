import Link from "next/link";
import { cn } from "@/lib/utils";

/** A crumb is a word, or a word with somewhere to go. */
export type Crumb = string | { label: string; href: string };

/**
 * Home / Woman / New In. Home is always a link, and so is any crumb given an
 * `href` — on a garment's page the line it came off is a real page, and a trail
 * that cannot be walked back up is only a label. The last crumb is where you
 * are, so it never links even if one is passed.
 */
export function Breadcrumb({
  trail,
  /** `light` is the trail over a photograph, where muted brown would vanish. */
  tone = "default",
}: {
  trail: Crumb[];
  tone?: "default" | "light";
}) {
  const light = tone === "light";
  const quiet = light ? "text-sandstone hover:text-cream" : "text-muted hover:text-ink";

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] tracking-[0.12em]",
        light ? "text-sandstone" : "text-muted",
      )}
    >
      <Link href="/" className={quiet}>
        Home
      </Link>
      {trail.map((crumb, i) => {
        const label = typeof crumb === "string" ? crumb : crumb.label;
        const last = i === trail.length - 1;
        const href = typeof crumb === "string" || last ? null : crumb.href;

        return (
          <span key={label} className="flex items-center gap-2">
            <span aria-hidden className={light ? "text-taupe" : "text-line"}>
              /
            </span>
            {href ? (
              <Link href={href} className={quiet}>
                {label}
              </Link>
            ) : (
              <span className={last ? (light ? "text-champagne" : "text-ink") : undefined}>
                {label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
