import { Outlet, redirect } from "react-router";

import { hasActivatedDevice } from "~/infrastructure/session/device-store";
import { resolvePosGuardRedirect } from "~/infrastructure/session/guards";
import { getSession } from "~/infrastructure/session/session-store";

export async function clientLoader() {
  const activated = await hasActivatedDevice();
  const redirectTo = resolvePosGuardRedirect(activated, getSession());
  if (redirectTo) {
    throw redirect(redirectTo);
  }
  return null;
}

export default function PosLayout() {
  return <Outlet />;
}
