import { silaiVoices } from "@/content/silai";

/**
 * Three customers, in their own words.
 *
 * No stars and no avatars: the page has already made its claims about fit and
 * alterations, and these are here to be the same claims from the other side of
 * the counter. Each quote is the one line a shopper would have wanted answered.
 */
export function SilaiVoices() {
  return (
    <section className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(48px,8vw,100px)]">
      <h2 className="font-display font-normal text-[clamp(26px,3.8vw,44px)] leading-[1.1] m-0 max-w-[18ch] text-pretty">
        What comes back to us
      </h2>

      <div className="mt-[clamp(26px,3.5vw,44px)] grid grid-cols-1 nav:grid-cols-3 gap-x-[clamp(20px,2.6vw,38px)] gap-y-8">
        {silaiVoices.map((voice) => (
          <figure
            key={voice.name}
            className="m-0 flex flex-col gap-5 border-t border-line pt-6"
          >
            <span
              aria-hidden
              className="-mb-2 font-display text-[52px] leading-[0.6] text-gold/40"
            >
              &ldquo;
            </span>
            <blockquote className="m-0 text-[clamp(15px,1.2vw,17px)] leading-[1.7] text-ink">
              {voice.quote}
            </blockquote>
            <figcaption className="mt-auto text-[11.5px] tracking-[0.2em] uppercase text-muted">
              {voice.name}
              <span aria-hidden className="mx-2 text-line">
                ·
              </span>
              {voice.city}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
