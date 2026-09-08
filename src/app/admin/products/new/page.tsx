import type { Metadata } from "next";
import { AdminHeading } from "@/app/admin/admin-ui";
import { ProductForm } from "@/app/admin/products/product-form";
import { requireStaff } from "@/modules/admin";

export const metadata: Metadata = { title: "New product" };
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireStaff("/admin/products/new");

  return (
    <>
      <AdminHeading
        title="New product"
        standfirst="Everything the shop needs to show a piece. It goes live as soon as it is saved unless you archive it."
      />
      <ProductForm
        values={{
          id: null,
          name: "",
          fabric: "",
          fabricFamily: "Lawn",
          type: "Kurtas",
          pieces: 1,
          withDupatta: false,
          collection: "Printed Lawn",
          aed: 0,
          wasAed: null,
          badgeLabel: "",
          badgeTone: "gold",
          cut: "",
          colour: "",
          description: "",
          careInstructions: "",
          isArchived: false,
          images: [],
          variants: [],
        }}
      />
    </>
  );
}
