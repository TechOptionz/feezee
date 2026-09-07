import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageFrame } from "@/components/layout/page-frame";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPanel } from "@/components/product/product-panel";
import { FeaturedArticles } from "@/components/sections/featured-articles";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { ProductRail } from "@/components/shop/product-rail";
import { collectionHref } from "@/content/collections";
import { productHref } from "@/content/products";
import {
  allProductSlugs,
  isInStock,
  productBySlug,
  relatedProducts,
} from "@/modules/catalogue";
import { img } from "@/lib/assets";
import { site } from "@/lib/site";

/**
 * One garment, on a page of its own.
 *
 * Prerendered for every slug the database holds at build time, and rendered on
 * demand for anything added since — `dynamicParams` is on, so a garment created
 * in the admin has a page the moment it is saved rather than at the next
 * deploy. `revalidate` keeps the price and the stock on a prerendered page from
 * going stale.
 */
export const dynamicParams = true;
export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await allProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await productBySlug(slug);
  if (!product) return {};

  const [cover] = product.images;

  return {
    title: product.name,
    description: `${product.name} — ${product.fabric}, ${product.colour}. ${product.cut}, stitched by FEEZEE or cut to your measurements through Silai.`,
    alternates: { canonical: productHref(product) },
    openGraph: {
      title: `${product.name} | FEEZEE`,
      description: product.description,
      url: `${site.url}${productHref(product)}`,
      type: "website",
      images: cover ? [{ url: img(cover), alt: product.name }] : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = await productBySlug(slug);
  if (!product) notFound();

  const related = await relatedProducts(product, 4);
  const url = `${site.url}${productHref(product)}`;
  const inStock = isInStock(product);

  return (
    <PageFrame>
      {/*
        The catalogue as a search engine reads it. Price is quoted in AED
        whatever the shop is displaying, because the conversion in
        `lib/currency` is a courtesy at render time, not a second price list.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description,
            sku: product.variants[0]?.sku.replace(/-[A-Z]+$/, "") ?? product.slug,
            color: product.colour,
            material: product.fabricFamily,
            brand: { "@type": "Brand", name: site.name },
            image: product.images.map((file) => `${site.url}${img(file)}`),
            offers: {
              "@type": "AggregateOffer",
              url,
              priceCurrency: "AED",
              lowPrice: Math.min(...product.variants.map((v) => v.priceAed)),
              highPrice: Math.max(...product.variants.map((v) => v.priceAed)),
              offerCount: product.variants.filter((v) => v.stock > 0).length,
              availability: inStock
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            },
          }),
        }}
      />

      <div className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(16px,2.4vw,30px)]">
        <Breadcrumb
          trail={[
            { label: "Woman", href: "/new-in" },
            { label: product.collection, href: collectionHref(product.collection) },
            product.name,
          ]}
        />
      </div>

      {/*
        Photographs left, the decision right, and the right column pinned while
        the left one runs — so the price and the button stay on screen however
        many frames of a garment there are to scroll past. Below the nav
        breakpoint the two stack and the pin is dropped, which is what makes the
        gallery a swipe rail instead of a column of full-width pictures.
      */}
      <div className="max-w-[var(--fz-container)] mx-auto px-[18px] mt-[clamp(14px,2vw,26px)] grid items-start gap-x-[clamp(24px,3.4vw,60px)] gap-y-[clamp(28px,3.5vw,44px)] nav:grid-cols-[minmax(0,1fr)_minmax(330px,30%)]">
        <div className="-mx-[18px] nav:mx-0">
          <ProductGallery images={product.images} alt={product.name} />
        </div>

        <div className="nav:sticky nav:top-6">
          <ProductPanel product={product} url={url} />
        </div>
      </div>

      <ProductRail
        heading="You May Also Like"
        standfirst={`More from ${product.collection}, and the cuts that sit closest to this one.`}
        products={related}
        viewAll={{
          href: collectionHref(product.collection),
          label: `View all ${product.collection.toLowerCase()}`,
        }}
      />

      <FeaturedArticles />
    </PageFrame>
  );
}
