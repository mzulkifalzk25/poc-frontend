import { redirect } from "react-router";

import { PlaceholderPage } from "~/components/ui/PlaceholderPage";
import { getDeviceStatus } from "~/infrastructure/session/device-store";
import { resolvePosGuardRedirect } from "~/infrastructure/session/guards";
import { getSession } from "~/infrastructure/session/session-store";

export async function clientLoader() {
  const redirectTo = resolvePosGuardRedirect(
    await getDeviceStatus(),
    getSession(),
  );
  if (redirectTo) {
    throw redirect(redirectTo);
  }
  return null;
}

export default function PosSignInRoute() {
  return <PlaceholderPage title="Start your shift" />;
}
