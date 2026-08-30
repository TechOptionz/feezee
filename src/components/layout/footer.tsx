import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { WhatsAppIcon } from "@/components/ui/icons";
import { footerNav } from "@/content/navigation";
import { contact, mapsHref, site, whatsappHref } from "@/lib/site";

function LinkColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    /*
     * A pointer can hit a line of text; a thumb needs the space around it. On
     * a phone the rows are set by padding on each link rather than by a gap
     * between them, which turns a 20px line into a 40px target without moving
     * anything on the page. From `nav` up the gap comes back and the links sit
     * as tightly as the design draws them.
     */
    <div className="flex-[1_1_150px] flex flex-col gap-y-0.5 nav:gap-y-2.5 text-[15px]">
      <div className="text-[13px] tracking-[0.22em] uppercase text-taupe mb-1">{title}</div>
      {links.map((link) =>
        /* WhatsApp and the like leave the site, so they get a plain anchor
           with the tab and the rel a router link would not carry. */
        link.href.startsWith("http") ? (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="py-2.5 nav:py-0 text-sandstone hover:text-champagne"
          >
            {link.label}
          </a>
        ) : (
          <Link
            key={link.label}
            href={link.href}
            className="py-2.5 nav:py-0 text-sandstone hover:text-champagne"
          >
            {link.label}
          </Link>
        ),
      )}
    </div>
  );
}

export function Footer() {
  return (
    <footer
      id="footer"
      className="bg-ink text-sandstone mt-[clamp(48px,7vw,90px)] px-[18px] pt-[clamp(40px,6vw,70px)] pb-[30px]"
    >
      <div className="max-w-[var(--fz-container)] mx-auto flex flex-wrap gap-[38px]">
        <div className="flex-[1_1_260px] flex flex-col gap-3">
          <Logo tone="light" className="h-[42px]" />
          <p className="mt-1.5 text-[15px] leading-[1.7] max-w-[38ch]">{site.description}</p>
        </div>

        {/*
          The two link columns are short enough to sit side by side on any
          phone, but their 150px basis only just clears a 375 window and misses
          a 320 one — which dropped Help onto a row of its own and left the
          foot four blocks tall. Paired here they hold two columns at every
          width; `nav:contents` dissolves the pair above it, so the row of five
          the design draws is untouched.
        */}
        <div className="flex-[1_1_100%] grid grid-cols-2 gap-x-6 nav:contents">
          <LinkColumn title="Shop" links={footerNav.shop} />
          <LinkColumn title="Help" links={footerNav.help} />
        </div>

        {/* The details off the shop's own invoice — one column, so a visitor
            who has scrolled this far can walk in, write, or open a chat. */}
        <div className="flex-[1_1_230px] flex flex-col gap-2.5 text-[15px]">
          <div className="text-[13px] tracking-[0.22em] uppercase text-taupe mb-1">
            Visit us
          </div>
          <address className="not-italic leading-[1.7]">
            <a
              href={mapsHref}
              target="_blank"
              rel="noreferrer"
              className="text-sandstone hover:text-champagne"
            >
              {contact.address.lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </a>
          </address>
          <a
            href={`mailto:${contact.email}`}
            className="text-sandstone hover:text-champagne break-all"
          >
            {contact.email}
          </a>
          <a
            href={whatsappHref()}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-2 self-start text-sandstone hover:text-champagne"
          >
            <WhatsAppIcon />
            {contact.whatsapp.display}
          </a>
          <p className="m-0 text-[13px] text-taupe">{contact.hours}</p>
        </div>

        <div className="flex-[1_1_240px] flex flex-col gap-3">
          <div className="text-[13px] tracking-[0.22em] uppercase text-taupe">Stay in touch</div>
          <p className="text-[15px] leading-[1.6]">
            New drops and festive edits, straight to your inbox.
          </p>
          {/* Presentational, as in the design — wire to a list provider when ready. */}
          <div className="flex">
            <input
              type="email"
              placeholder="Email address"
              aria-label="Email address"
              className="flex-1 bg-transparent border border-ink-border border-r-0 text-cream px-3.5 py-3 text-[15px] outline-none min-w-0 placeholder:text-taupe"
            />
            <button
              type="button"
              className="bg-gold text-ink border-none px-5 py-3 text-[13px] tracking-[0.16em] uppercase cursor-pointer"
            >
              Join
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[var(--fz-container)] mx-auto mt-[34px] border-t border-ink-line pt-[18px] flex justify-between gap-3 flex-wrap text-[13px] text-taupe">
        <span>
          © {new Date().getFullYear()} {contact.legalName}
        </span>
        <span>Cash on Delivery · Bank Transfer · Cards</span>
      </div>
    </footer>
  );
}
