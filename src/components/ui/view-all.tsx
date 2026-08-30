import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The rule-underlined "View all" link that closes each shop section. Both
 * sections end the same way, so the type scale and the gold live here once.
 *
 * It is a `Link` rather than an anchor: every one of these now points at a
 * shop page, and going through the router keeps the bag and the wishlist —
 * which live in client state above the page — from being thrown away on the
 * way there.
 */
export function ViewAll({
  href,
  children = "View all",
  className,
}: {
  href: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        /* The extra height a thumb needs is taken above the words, so the rule
           under them stays where the design puts it. */
        "inline-block text-[14px] tracking-[0.16em] uppercase text-gold-dark hover:text-ink pt-2.5 pb-0.5 border-b border-current transition-colors duration-200",
        className,
      )}
    >
      {children} →
    </Link>
  );
}
