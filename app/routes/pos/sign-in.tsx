import { redirect } from "react-router";

import { PlaceholderPage } from "~/components/ui/PlaceholderPage";
import { hasActivatedDevice } from "~/infrastructure/session/device-store";
import { resolvePosSignInGuardRedirect } from "~/infrastructure/session/guards";

export async function clientLoader() {
  const activated = await hasActivatedDevice();
  const redirectTo = resolvePosSignInGuardRedirect(activated);
  if (redirectTo) {
    throw redirect(redirectTo);
  }
  return null;
}

export default function PosSignInRoute() {
  return <PlaceholderPage title="Start your shift" />;
}
