import { Outlet, redirect } from "react-router";

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
  return <Outlet />;
}
