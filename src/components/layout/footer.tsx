import { Logo } from "@/components/ui/logo";
import { footerNav } from "@/content/navigation";
import { site } from "@/lib/site";

function LinkColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <div className="flex-[1_1_150px] flex flex-col gap-2.5 text-sm">
      <div className="text-xs tracking-[0.22em] uppercase text-taupe mb-1">{title}</div>
      {links.map((link) => (
        <a key={link.label} href={link.href} className="text-sandstone hover:text-champagne">
          {link.label}
        </a>
      ))}
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
          <p className="mt-1.5 text-sm leading-[1.7] max-w-[38ch]">{site.description}</p>
        </div>

        <LinkColumn title="Shop" links={footerNav.shop} />
        <LinkColumn title="Help" links={footerNav.help} />

        <div className="flex-[1_1_260px] flex flex-col gap-3">
          <div className="text-xs tracking-[0.22em] uppercase text-taupe">Stay in touch</div>
          <p className="text-sm leading-[1.6]">
            New drops and festive edits, straight to your inbox.
          </p>
          {/* Presentational, as in the design — wire to a list provider when ready. */}
          <div className="flex">
            <input
              type="email"
              placeholder="Email address"
              aria-label="Email address"
              className="flex-1 bg-transparent border border-ink-border border-r-0 text-cream px-3.5 py-3 text-sm outline-none min-w-0 placeholder:text-taupe"
            />
            <button
              type="button"
              className="bg-gold text-ink border-none px-5 py-3 text-xs tracking-[0.16em] uppercase cursor-pointer"
            >
              Join
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[var(--fz-container)] mx-auto mt-[34px] border-t border-ink-line pt-[18px] flex justify-between gap-3 flex-wrap text-xs text-taupe">
        <span>
          © {new Date().getFullYear()} {site.name} Fashion
        </span>
        <span>Cash on Delivery · Bank Transfer · Cards</span>
      </div>
    </footer>
  );
}
