"use client";

import { createContext, useCallback, useContext } from "react";
import { ADMIN_PREFIX, adminPath, type AdminBase } from "@/lib/admin-host";

/**
 * `getAdminPath` for the browser.
 *
 * The server knows which host it is answering on; a client component does not,
 * so the admin layout works it out once and hands it down here. Outside the
 * provider the base is `/admin`, which is what a deploy preview uses.
 */
const AdminBaseContext = createContext<AdminBase>(ADMIN_PREFIX);

export function AdminPathProvider({
  base,
  children,
}: {
  base: AdminBase;
  children: React.ReactNode;
}) {
  return <AdminBaseContext value={base}>{children}</AdminBaseContext>;
}

export function useAdminPath(): (path: string) => string {
  const base = useContext(AdminBaseContext);
  return useCallback((path: string) => adminPath(base, path), [base]);
}
