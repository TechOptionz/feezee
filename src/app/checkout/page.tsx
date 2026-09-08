import type { Metadata } from "next";
import { CheckoutForm } from "@/app/checkout/checkout-form";
import { PageFrame } from "@/components/layout/page-frame";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { availablePaymentOptions } from "@/modules/payments";
import { currentUser, listAddresses } from "@/modules/customers";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your FEEZEE order — UAE delivery, VAT included.",
};

/** Reads the session, so it is rendered per request rather than cached. */
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await currentUser();
  const addresses = user ? await listAddresses(user.id) : [];

  return (
    <PageFrame>
      <div className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(20px,3vw,40px)]">
        <Breadcrumb trail={[{ label: "Your Bag", href: "/cart" }, "Checkout"]} />
        <h1 className="mt-[clamp(20px,3vw,34px)] mb-[clamp(20px,3vw,32px)] font-display font-normal text-[clamp(34px,5vw,58px)] leading-[1.05] uppercase">
          Checkout
        </h1>

        <CheckoutForm
          paymentOptions={availablePaymentOptions()}
          addresses={addresses}
          signedIn={Boolean(user)}
          defaults={
            user
              ? { fullName: user.name, email: user.email, phone: user.phone ?? "" }
              : null
          }
        />
      </div>
    </PageFrame>
  );
}
