import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PageFrame } from "@/components/layout/page-frame";
import { FeaturedArticles } from "@/components/sections/featured-articles";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { MadeToOrderBand } from "@/components/shop/made-to-order-band";
import { articles, articleBySlug, articleHref } from "@/content/journal";
import { img } from "@/lib/assets";
import { site } from "@/lib/site";

/**
 * One piece from the journal.
 *
 * A single measure of text on a cream page: no sidebar, no rail beside the
 * words. What follows the last line is the same two things a garment's page
 * ends with — a way to have something made, and the rest of the journal.
 */
export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/journal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.standfirst,
    alternates: { canonical: articleHref(article) },
    openGraph: {
      title: `${article.title} | FEEZEE`,
      description: article.standfirst,
      url: `${site.url}${articleHref(article)}`,
      type: "article",
      images: [{ url: img(article.image), alt: article.title }],
    },
  };
}

export default async function ArticlePage({
  params,
}: PageProps<"/journal/[slug]">) {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article) notFound();

  return (
    <PageFrame>
      <div className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(16px,2.4vw,30px)]">
        <Breadcrumb trail={["Journal", article.title]} />
      </div>

      <article className="max-w-[760px] mx-auto px-[18px] pt-[clamp(24px,3.4vw,44px)]">
        <p className="m-0 flex items-center gap-3 text-[12.5px] tracking-[0.3em] uppercase text-muted">
          <span aria-hidden className="h-px w-[clamp(22px,3vw,40px)] bg-gold/70" />
          {article.category}
        </p>

        <h1 className="mt-[clamp(10px,1.4vw,16px)] mb-0 font-display font-normal text-[clamp(30px,4.4vw,52px)] leading-[1.08]">
          {article.title}
        </h1>

        <p className="mt-[clamp(14px,1.8vw,20px)] mb-0 text-[clamp(16px,1.2vw,18px)] leading-[1.65] text-cocoa">
          {article.standfirst}
        </p>

        <p className="mt-5 mb-0 flex flex-wrap items-center gap-2.5 text-[12.5px] tracking-[0.16em] uppercase text-muted">
          {article.date}
          <span aria-hidden className="text-line">
            ·
          </span>
          {article.readingMinutes} min read
        </p>

        <div className="relative mt-[clamp(24px,3.2vw,40px)] aspect-[3/2] bg-sand">
          <Image
            src={img(article.image)}
            alt=""
            fill
            priority
            sizes="(max-width: 800px) 100vw, 760px"
            className="object-cover object-top"
          />
        </div>

        <div className="mt-[clamp(26px,3.4vw,44px)] flex flex-col gap-5 text-[16px] leading-[1.8] text-cocoa">
          {article.body.map((block, i) =>
            typeof block === "string" ? (
              <p key={i} className="m-0">
                {block}
              </p>
            ) : (
              <h2
                key={i}
                className="mt-[clamp(10px,1.6vw,20px)] mb-0 font-display font-normal text-[clamp(21px,2.2vw,28px)] leading-[1.2] text-ink"
              >
                {block.heading}
              </h2>
            ),
          )}
        </div>
      </article>

      <MadeToOrderBand line="Want this design cut to your own measurements?" />
      <FeaturedArticles heading="More from the Journal" exceptSlug={article.slug} />
    </PageFrame>
  );
}
