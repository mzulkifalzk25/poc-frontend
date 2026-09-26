import { Outlet, redirect } from "react-router";

import { AdminSidebar } from "~/components/admin/AdminSidebar";
import { ToastProvider } from "~/components/ui/ToastProvider";
import { resolveAdminGuardRedirect } from "~/infrastructure/session/guards";
import { getSession } from "~/infrastructure/session/session-store";

export function clientLoader() {
  const redirectTo = resolveAdminGuardRedirect(getSession());
  if (redirectTo) {
    throw redirect(redirectTo);
  }
  return null;
}

export default function AdminLayout() {
  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-off-white">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </ToastProvider>
  );
}
