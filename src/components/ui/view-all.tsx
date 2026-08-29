import { cn } from "@/lib/utils";

/**
 * The rule-underlined "View all" link that closes each shop section. Both
 * sections end the same way, so the type scale and the gold live here once.
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
    <a
      href={href}
      className={cn(
        "inline-block text-[13px] tracking-[0.16em] uppercase text-gold-dark hover:text-ink border-b border-current pb-0.5 transition-colors duration-200",
        className,
      )}
    >
      {children} →
    </a>
  );
}
