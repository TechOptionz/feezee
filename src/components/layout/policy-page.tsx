import Link from "next/link";
import { PageFrame } from "@/components/layout/page-frame";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { WhatsAppIcon } from "@/components/ui/icons";
import { contact, mapsHref, whatsappHref } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The three policy pages, in one shape.
 *
 * A policy is still a FEEZEE page — cream, a display heading, a single measure
 * of text like the journal — but it is read differently from a collection. It
 * is read in a hurry, by someone looking for one clause, usually because
 * something has gone wrong. So it gets headed sections it can be scrolled
 * through, a stated date so a reader knows which version they agreed to, and
 * the shop's real address and WhatsApp number at the foot of every one of
 * them, because "contact us" with nothing to contact is how a policy stops
 * being a promise and becomes a formality.
 */

export const POLICY_PAGES = [
  { href: "/shipping-and-returns", label: "Shipping & Returns" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
] as const;

export function PolicyPage({
  title,
  eyebrow,
  standfirst,
  updated,
  children,
}: {
  title: string;
  eyebrow: string;
  standfirst: string;
  /** The date this text last changed, written the way it is read aloud. */
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <PageFrame>
      <div className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(16px,2.4vw,30px)]">
        <Breadcrumb trail={[title]} />
      </div>

      <article className="max-w-[760px] mx-auto px-[18px] pt-[clamp(24px,3.4vw,44px)]">
        <p className="m-0 flex items-center gap-3 text-[12.5px] tracking-[0.3em] uppercase text-muted">
          <span aria-hidden className="h-px w-[clamp(22px,3vw,40px)] bg-gold/70" />
          {eyebrow}
        </p>

        <h1 className="mt-[clamp(10px,1.4vw,16px)] mb-0 font-display font-normal text-[clamp(30px,4.4vw,52px)] leading-[1.08] uppercase">
          {title}
        </h1>

        <p className="mt-[clamp(14px,1.8vw,20px)] mb-0 text-[clamp(16px,1.2vw,18px)] leading-[1.65] text-cocoa">
          {standfirst}
        </p>

        <p className="mt-5 mb-0 text-[12.5px] tracking-[0.16em] uppercase text-muted">
          Last updated {updated}
        </p>

        <div className="mt-[clamp(26px,3.4vw,44px)] flex flex-col gap-[clamp(26px,3.2vw,40px)]">
          {children}
        </div>

        <PolicyContact />
        <PolicyCrossLinks current={title} />
      </article>
    </PageFrame>
  );
}

/** A headed clause. The heading is the thing a reader is scanning for. */
export function PolicySection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="m-0 font-display font-normal text-[clamp(21px,2.2vw,28px)] leading-[1.2] text-ink">
        {heading}
      </h2>
      <div className="mt-[clamp(10px,1.4vw,16px)] flex flex-col gap-4 text-[16px] leading-[1.8] text-cocoa">
        {children}
      </div>
    </section>
  );
}

/** An ordinary paragraph, so a page never has to remember the type scale. */
export function P({ children }: { children: React.ReactNode }) {
  return <p className="m-0">{children}</p>;
}

/**
 * A list of conditions. Marked with a gold rule rather than a bullet — the
 * cream pages carry no round bullets anywhere else, and a policy is the last
 * place to introduce a new mark.
 */
export function PolicyList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {items.map((item, i) => (
        <li key={i} className="relative pl-5">
          <span
            aria-hidden
            className="absolute left-0 top-[0.85em] h-px w-[10px] bg-gold/70"
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

/** The one thing on the page a reader must not miss. */
export function PolicyNote({
  title,
  children,
  tone = "default",
}: {
  title?: string;
  children: React.ReactNode;
  tone?: "default" | "wine";
}) {
  return (
    <div
      className={cn(
        "border-l-2 bg-panel px-[clamp(16px,2vw,22px)] py-[clamp(14px,1.8vw,18px)]",
        tone === "wine" ? "border-wine" : "border-gold",
      )}
    >
      {title && (
        <p className="m-0 mb-1.5 text-[12.5px] tracking-[0.16em] uppercase text-muted">
          {title}
        </p>
      )}
      <div className="flex flex-col gap-3 text-[15.5px] leading-[1.75] text-cocoa">
        {children}
      </div>
    </div>
  );
}

/** A definition row — "Dubai … next working day". Used by the delivery table. */
export function PolicyRows({
  rows,
}: {
  rows: { term: string; detail: React.ReactNode }[];
}) {
  return (
    <dl className="m-0 border-t border-line">
      {rows.map((row) => (
        <div
          key={row.term}
          className="flex flex-col gap-1 border-b border-line py-3.5 nav:flex-row nav:gap-6"
        >
          <dt className="text-[13px] tracking-[0.16em] uppercase text-muted nav:w-[210px] nav:shrink-0">
            {row.term}
          </dt>
          <dd className="m-0 text-[15.5px] leading-[1.7] text-cocoa">{row.detail}</dd>
        </div>
      ))}
    </dl>
  );
}

/** An in-prose link, styled once so three pages cannot drift apart. */
export function PolicyLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const external = href.startsWith("http") || href.startsWith("mailto:");
  const className =
    "text-gold-dark underline underline-offset-[3px] decoration-gold/50 hover:text-ink";

  return external ? (
    <a
      href={href}
      className={className}
      {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {children}
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

/** Who the policy is a promise from, and how to hold them to it. */
function PolicyContact() {
  return (
    <section className="mt-[clamp(30px,4vw,50px)] border-t border-line pt-[clamp(22px,3vw,34px)]">
      <h2 className="m-0 font-display font-normal text-[clamp(21px,2.2vw,28px)] leading-[1.2] text-ink">
        Getting in touch
      </h2>
      <p className="mt-3 mb-0 text-[16px] leading-[1.8] text-cocoa">
        Anything on this page can be asked about in plain words. The fastest
        answer is WhatsApp; the shop is open {contact.hours}.
      </p>

      <address className="mt-5 flex flex-col gap-2 not-italic text-[15.5px] leading-[1.7] text-cocoa">
        <span className="text-[13px] tracking-[0.16em] uppercase text-muted">
          {contact.legalName}
        </span>
        <PolicyLink href={mapsHref}>{contact.address.oneLine}</PolicyLink>
        <PolicyLink href={`mailto:${contact.email}`}>{contact.email}</PolicyLink>
        <a
          href={whatsappHref("Hello FEEZEE, I have a question about your policies.")}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 self-start text-gold-dark hover:text-ink"
        >
          <WhatsAppIcon />
          {contact.whatsapp.display}
        </a>
      </address>
    </section>
  );
}

/** The other two policies. Whoever reads one usually wants a second. */
function PolicyCrossLinks({ current }: { current: string }) {
  const others = POLICY_PAGES.filter((page) => page.label !== current);

  return (
    <nav
      aria-label="Other policies"
      className="mt-[clamp(22px,3vw,34px)] flex flex-wrap gap-x-7 gap-y-2 border-t border-line pt-[clamp(16px,2vw,22px)]"
    >
      {others.map((page) => (
        <Link
          key={page.href}
          href={page.href}
          className="text-[12.5px] tracking-[0.16em] uppercase text-muted hover:text-ink"
        >
          {page.label} →
        </Link>
      ))}
    </nav>
  );
}
