import Link from "next/link";
import { PageFrame } from "@/components/layout/page-frame";

/**
 * The card the four auth screens sit in: narrow, centred, and nothing else on
 * the page. A sign-in form beside a grid of garments is a form nobody finishes.
 */
export function AuthShell({
  eyebrow,
  title,
  standfirst,
  children,
}: {
  eyebrow: string;
  title: string;
  standfirst?: string;
  children: React.ReactNode;
}) {
  return (
    <PageFrame>
      <div className="mx-auto w-full max-w-[460px] px-[18px] py-[clamp(36px,6vw,84px)]">
        <p className="m-0 flex items-center gap-3 text-[12px] tracking-[0.3em] uppercase text-muted">
          <span aria-hidden className="h-px w-[clamp(18px,2vw,30px)] bg-gold/70" />
          {eyebrow}
        </p>

        <h1 className="mt-[clamp(10px,1.4vw,16px)] mb-0 font-display font-normal text-[clamp(30px,4vw,44px)] leading-[1.08] uppercase">
          {title}
        </h1>

        {standfirst && (
          <p className="mt-3 mb-0 text-[14.5px] leading-[1.7] text-cocoa">
            {standfirst}
          </p>
        )}

        <div className="mt-[clamp(22px,3vw,32px)]">{children}</div>

        <p className="mt-8 mb-0 text-[12.5px] text-muted">
          <Link href="/" className="text-muted hover:text-ink">
            ← Back to the shop
          </Link>
        </p>
      </div>
    </PageFrame>
  );
}
