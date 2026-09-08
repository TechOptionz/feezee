import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountShell } from "@/app/account/account-shell";
import { AddressBook } from "@/app/account/addresses/address-book";
import { currentUser, listAddresses } from "@/modules/customers";

export const metadata: Metadata = {
  title: "Your addresses",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountAddressesPage() {
  const user = await currentUser();
  if (!user) redirect("/account/login?next=/account/addresses");

  const addresses = await listAddresses(user.id);

  return (
    <AccountShell
      current="/account/addresses"
      title="Addresses"
      name={user.name}
      standfirst="Where your parcels go. The default one fills the checkout in for you."
    >
      <AddressBook addresses={addresses} />
    </AccountShell>
  );
}
