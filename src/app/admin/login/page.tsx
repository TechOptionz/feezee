import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/app/admin/login/login-form";
import { currentActor, getAdminBase } from "@/modules/admin";
import { adminPath } from "@/lib/admin-host";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const { next } = await searchParams;
  const base = await getAdminBase();
  if (await currentActor()) redirect(adminPath(base, "/"));

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-[400px]">
        <div className="text-center">
          <span className="block font-display text-[26px] leading-none tracking-[0.24em] uppercase text-champagne">
            FEEZEE
          </span>
          <span className="mt-2 block text-[11px] font-medium tracking-[0.24em] uppercase text-taupe">
            Back office
          </span>
        </div>

        <h1 className="mt-9 mb-2 text-center font-display font-normal text-[26px] leading-tight uppercase text-champagne">
          Sign in
        </h1>
        <p className="m-0 mb-7 text-center text-[14px] leading-[1.7] text-taupe">
          Staff and administrators only.
        </p>

        <AdminLoginForm next={typeof next === "string" ? next : adminPath(base, "/")} />

        {/*
          The layout draws no sidebar until there is somebody to draw it for,
          so this page has no navigation at all. Without this line a customer
          who followed a link here has nothing to click but the back button.
        */}
        <p className="mt-8 mb-0 text-center text-[12px] font-medium tracking-[0.1em] uppercase">
          <Link href={base === "" ? site.url : "/"} className="text-taupe hover:text-champagne">
            Return to the shop ↗
          </Link>
        </p>
      </div>
    </div>
  );
}
