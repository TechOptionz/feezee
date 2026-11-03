import type { Metadata } from "next";
import { AdminHeading, Panel } from "@/app/admin/admin-ui";
import { requireStaff } from "@/modules/admin";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "My account" };
export const dynamic = "force-dynamic";

/**
 * The signed-in staff member's own account.
 *
 * Staff cannot use the shop's `/account` pages (§4.19), so without this the
 * seeded administrator password could only be changed in the database.
 */
export default async function AdminAccountPage() {
  const actor = await requireStaff("/admin/account");

  return (
    <>
      <AdminHeading
        title="My account"
        standfirst={`Signed in as ${actor.name} (${actor.email}).`}
      />

      <Panel title="Change password" className="max-w-[560px]">
        <PasswordForm />
      </Panel>
    </>
  );
}
