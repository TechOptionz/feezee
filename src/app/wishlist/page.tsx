import type { Metadata } from "next";
import { WishlistContents } from "@/app/wishlist/wishlist-contents";
import { PageFrame } from "@/components/layout/page-frame";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { ShopSubnav } from "@/components/shop/shop-subnav";
import { MadeToOrderBand } from "@/components/shop/made-to-order-band";
import { catalogueForClient } from "@/modules/catalogue/collections";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "The FEEZEE pieces you have saved.",
};

export default async function WishlistPage() {
  const catalogue = await catalogueForClient();

  return (
    <PageFrame>
      <div className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(20px,3vw,40px)]">
        <Breadcrumb trail={["Wishlist"]} />
        <h1 className="mt-[clamp(20px,3vw,34px)] mb-[clamp(14px,1.8vw,20px)] font-display font-normal text-[clamp(34px,5vw,58px)] leading-[1.05] uppercase">
          Wishlist
        </h1>
        <p className="m-0 mb-[clamp(24px,3vw,38px)] max-w-[62ch] text-[15px] leading-[1.7] text-cocoa">
          Saved to your account when you are signed in, and to this device when
          you are not. Nothing is reserved — a piece can still sell out while it
          sits here, so the sale rail is worth checking twice.
        </p>

        <div className="mb-[clamp(20px,2.6vw,32px)]">
          <ShopSubnav />
        </div>

        <WishlistContents catalogue={catalogue} />
      </div>
      <MadeToOrderBand line="Saved something that is out of your size?" />
    </PageFrame>
  );
}
