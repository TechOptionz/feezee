import { ProductCard } from "@/components/ui/product-card";
import { products } from "@/content/products";

export function NewArrivals() {
  return (
    <section
      id="new"
      className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(44px,7vw,90px)]"
    >
      <div className="flex items-baseline justify-between gap-3 mb-6 flex-wrap">
        <h2 className="font-display font-normal text-[clamp(24px,3.4vw,36px)] m-0">
          New Arrivals
        </h2>
        <a href="#new" className="text-[13px] tracking-[0.16em] uppercase">
          View all →
        </a>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-x-3 gap-y-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
