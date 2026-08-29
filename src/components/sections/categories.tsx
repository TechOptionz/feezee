import Image from "next/image";
import { categories } from "@/content/products";
import { img } from "@/lib/assets";

export function Categories() {
  return (
    <section
      id="categories"
      className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(40px,7vw,84px)]"
    >
      <h2 className="font-display font-normal text-[clamp(24px,3.4vw,36px)] text-center m-0 mb-2">
        Shop by Category
      </h2>
      <div className="text-center text-[13px] tracking-[0.2em] uppercase text-muted mb-7">
        Kurtas · Suits · Co-ords · Dupattas
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
        {categories.map((cat) => (
          <a
            key={cat.name}
            href={cat.href}
            className="group relative block aspect-[3/4] overflow-hidden bg-sand"
          >
            <Image
              src={img(cat.img)}
              alt={cat.name}
              fill
              sizes="(max-width: 640px) 50vw, 320px"
              className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
            />
            <span className="absolute left-0 right-0 bottom-0 bg-[linear-gradient(180deg,rgba(43,33,24,0),rgba(43,33,24,0.7))] text-cream px-3 pt-9 pb-3 text-[13px] tracking-[0.16em] uppercase text-center">
              {cat.name}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
