"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Logo } from "@/components/ui/logo";

/**
 * The recoverable error page, for a route that threw while rendering.
 *
 * This is a client boundary, so it cannot mount the async `PageFrame` — the
 * header and footer both read the database, and the thing that broke may well
 * have been the database. It carries its own cream ground and the gold lockup
 * instead, so a visitor still knows whose shop they are standing in, and
 * offers the two moves that help: try the page again, or step back to the
 * rail. The error's digest is shown small so a customer can quote it to us.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaces in the server logs on Vercel and in the console locally.
    console.error(error);
  }, [error]);

  return (
    <div className="bg-cream min-h-screen flex flex-col">
      <header className="border-b border-line">
        <div className="max-w-[var(--fz-container)] mx-auto px-[18px] py-[clamp(14px,2vw,22px)] flex justify-center nav:justify-start">
          <Link href="/" aria-label="FEEZEE Fashion — home" className="block py-1">
            <Logo className="h-[clamp(30px,4vw,44px)]" />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center">
        <div className="max-w-[var(--fz-container)] mx-auto w-full px-[18px] py-[clamp(48px,8vw,112px)]">
          <div className="max-w-[640px]">
            <p className="m-0 flex items-center gap-3 text-[12.5px] tracking-[0.3em] uppercase text-muted">
              <span aria-hidden className="h-px w-[clamp(22px,3vw,40px)] bg-gold/70" />
              A loose thread
            </p>

            <h1 className="mt-[clamp(8px,1.2vw,14px)] mb-0 font-display font-normal text-[clamp(34px,5.5vw,64px)] leading-[1.04] uppercase">
              Something Slipped
              <br />
              Off the Rail
            </h1>

            <p className="mt-[clamp(10px,1.4vw,16px)] mb-0 font-display text-[clamp(17px,2vw,24px)] leading-[1.3] text-gold-dark">
              The page did not finish dressing
            </p>

            <p className="mt-[clamp(14px,1.8vw,22px)] mb-0 max-w-[56ch] text-[15.5px] leading-[1.75] text-cocoa">
              A small fault on our side interrupted this page while it was
              loading. Nothing in your bag or your order has been touched. Trying
              again usually mends it; if it does not, the boutique rail is a step
              away and we will keep working on this one.
            </p>

            <div className="mt-[clamp(26px,3.4vw,44px)] flex flex-col sm:flex-row sm:flex-wrap gap-4">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center justify-center text-center cursor-pointer border-none bg-gold text-ink hover:text-ink px-[clamp(28px,3vw,40px)] py-4 text-[13px] tracking-[0.18em] uppercase transition-transform duration-300 hover:-translate-y-0.5"
              >
                Try Again
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center text-center border border-ink text-ink hover:text-cream hover:bg-ink px-[clamp(28px,3vw,40px)] py-4 text-[13px] tracking-[0.18em] uppercase transition-colors duration-300"
              >
                Return to Boutique
              </Link>
            </div>

            {error.digest ? (
              <p className="mt-[clamp(28px,4vw,48px)] mb-0 text-[12px] tracking-[0.14em] uppercase text-muted">
                Reference <span className="text-cocoa">{error.digest}</span>
              </p>
            ) : null}
          </div>
        </div>
      </main>

      <footer className="border-t border-line">
        <div className="max-w-[var(--fz-container)] mx-auto px-[18px] py-6 flex flex-wrap justify-between gap-x-6 gap-y-2 text-[12px] tracking-[0.14em] uppercase text-muted">
          <span>FEEZEE Fashion</span>
          <Link href="/track-order" className="text-gold-dark hover:text-ink">
            Track an order
          </Link>
        </div>
      </footer>
    </div>
  );
}
