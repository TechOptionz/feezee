import type { Metadata } from "next";
import { CartContents } from "@/app/cart/cart-contents";
import { PageFrame } from "@/components/layout/page-frame";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { LineStrip } from "@/components/shop/line-strip";
import { Values } from "@/components/sections/values";

export const metadata: Metadata = {
  title: "Your Bag",
  description: "Review your FEEZEE bag and check out.",
};

export default function CartPage() {
  return (
    <PageFrame>
      <div className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(20px,3vw,40px)]">
        <Breadcrumb trail={["Your Bag"]} />
        <h1 className="mt-[clamp(20px,3vw,34px)] mb-[clamp(20px,3vw,32px)] font-display font-normal text-[clamp(34px,5vw,58px)] leading-[1.05] uppercase">
          Your Bag
        </h1>
        <CartContents />
      </div>
      <LineStrip
        heading="Keep shopping"
        standfirst="Three lines, restocked every Thursday."
      />
      <Values />
    </PageFrame>
  );
}
