import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/app/admin/login/login-form";
import { currentActor } from "@/modules/admin";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const { next } = await searchParams;
  if (await currentActor()) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-[400px]">
        <div className="text-center">
          <span className="block font-display text-[26px] leading-none tracking-[0.24em] uppercase text-champagne">
            FEEZEE
          </span>
          <span className="mt-2 block text-[11px] tracking-[0.3em] uppercase text-taupe">
            Back office
          </span>
        </div>

        <h1 className="mt-9 mb-2 text-center font-display font-normal text-[26px] leading-tight uppercase text-champagne">
          Sign in
        </h1>
        <p className="m-0 mb-7 text-center text-[13.5px] leading-[1.7] text-taupe">
          Staff and administrators only.
        </p>

        <AdminLoginForm next={typeof next === "string" ? next : "/admin"} />
      </div>
    </div>
  );
}
