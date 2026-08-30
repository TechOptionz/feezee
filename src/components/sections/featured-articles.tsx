import Image from "next/image";
import Link from "next/link";
import { articleHref, featuredArticles } from "@/content/journal";
import { img } from "@/lib/assets";

/**
 * The journal, three across, closing a garment's page under the rail of other
 * garments.
 *
 * A product page ends in one of two places: the bag, or a question — how do I
 * wash this, will it fit, what is ajrak. The rail answers the first ending and
 * this answers the second, which is why it sits below rather than beside it.
 */
export function FeaturedArticles({
  heading = "Featured Articles",
  /** The piece being read, so the journal never links to the page it is on. */
  exceptSlug,
}: {
  heading?: string;
  exceptSlug?: string;
}) {
  const shown = featuredArticles(exceptSlug);
  if (shown.length === 0) return null;

  return (
    <section className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(48px,7.5vw,96px)]">
      <p className="m-0 flex items-center gap-3 text-[11.5px] tracking-[0.3em] uppercase text-muted">
        <span aria-hidden className="h-px w-[clamp(22px,3vw,40px)] bg-gold/70" />
        The FEEZEE Journal
      </p>

      <h2 className="mt-[clamp(10px,1.4vw,16px)] mb-0 font-display font-normal text-[clamp(28px,4vw,44px)] leading-[1.08]">
        {heading}
      </h2>

      <div className="mt-[clamp(24px,3.2vw,42px)] grid gap-x-[clamp(16px,2.4vw,32px)] gap-y-[clamp(28px,3.4vw,44px)] nav:grid-cols-3">
        {shown.map((article) => (
          <article key={article.slug} className="group flex flex-col">
            <Link
              href={articleHref(article)}
              className="relative block aspect-[4/3] overflow-hidden bg-sand"
              tabIndex={-1}
              aria-hidden
            >
              <Image
                src={img(article.image)}
                alt=""
                fill
                sizes="(max-width: 860px) 100vw, 33vw"
                className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
              />
            </Link>

            <p className="mt-4 mb-0 flex items-center gap-2.5 text-[11px] tracking-[0.22em] uppercase text-muted">
              {article.category}
              <span aria-hidden className="text-line">
                ·
              </span>
              {article.readingMinutes} min read
            </p>

            <h3 className="mt-2.5 mb-0 font-display font-normal text-[clamp(19px,1.7vw,23px)] leading-[1.25]">
              <Link
                href={articleHref(article)}
                className="text-ink hover:text-gold-dark"
              >
                {article.title}
              </Link>
            </h3>

            <p className="mt-2.5 mb-0 text-[14px] leading-[1.7] text-cocoa">
              {article.standfirst}
            </p>

            <p className="mt-3.5 mb-0 text-[11.5px] tracking-[0.16em] uppercase text-gold-dark">
              Read the piece →
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
