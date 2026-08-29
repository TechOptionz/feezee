import Image from "next/image";
import { lookbook } from "@/content/products";
import { img } from "@/lib/assets";

export function Lookbook() {
  return (
    <section className="pt-[clamp(40px,6vw,72px)]">
      <div className="text-center text-xs tracking-[0.3em] uppercase text-muted mb-1.5">
        @feezee.fashion
      </div>
      <h2 className="font-display font-normal text-[clamp(22px,3vw,30px)] text-center m-0 mb-6">
        From the Boutique
      </h2>
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-[18px] pb-2">
        {lookbook.map((file) => (
          <Image
            key={file}
            src={img(file)}
            alt="FEEZEE lookbook"
            width={180}
            height={240}
            sizes="180px"
            className="w-[180px] h-[240px] object-cover object-top shrink-0"
          />
        ))}
      </div>
    </section>
  );
}
