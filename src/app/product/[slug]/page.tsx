import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageFrame } from "@/components/layout/page-frame";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPanel } from "@/components/product/product-panel";
import { FeaturedArticles } from "@/components/sections/featured-articles";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { ProductRail } from "@/components/shop/product-rail";
import { collectionHref } from "@/content/collections";
import { productDetail, sizeOptions } from "@/content/product-detail";
import {
  allProductSlugs,
  productBySlug,
  productHref,
  productImages,
  productSku,
  relatedProducts,
} from "@/content/products";
import { img } from "@/lib/assets";
import { site } from "@/lib/site";

/**
 * One garment, on a page of its own.
 *
 * The whole catalogue is known at build time, so every one of these pages is
 * static: the photographs, the copy and the size chart are all in the repo, and
 * the only thing that has to happen in the browser is choosing a size and
 * adding to the bag.
 */
export function generateStaticParams() {
  return allProductSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) return {};

  const detail = productDetail(product);
  const [cover] = productImages(product);

  return {
    title: product.name,
    description: `${product.name} — ${product.fabric}, ${detail.colour}. ${detail.cut}, stitched by FEEZEE or cut to your measurements through Silai.`,
    alternates: { canonical: productHref(product) },
    openGraph: {
      title: `${product.name} | FEEZEE`,
      description: detail.description,
      url: `${site.url}${productHref(product)}`,
      type: "website",
      images: [{ url: img(cover), alt: product.name }],
    },
  };
}

export default async function ProductPage({
  params,
}: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) notFound();

  const detail = productDetail(product);
  const images = productImages(product);
  const related = relatedProducts(product, 4);
  const url = `${site.url}${productHref(product)}`;
  const inStock = sizeOptions(product).some((option) => option.state !== "out");

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
            description: detail.description,
            sku: productSku(product),
            color: detail.colour,
            material: detail.components[0]?.fabric ?? product.fabricFamily,
            brand: { "@type": "Brand", name: site.name },
            image: images.map((file) => `${site.url}${img(file)}`),
            offers: {
              "@type": "Offer",
              url,
              priceCurrency: "AED",
              price: product.aed,
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
          <ProductGallery images={images} alt={product.name} />
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
