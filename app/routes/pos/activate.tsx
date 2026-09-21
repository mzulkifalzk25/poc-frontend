import { redirect } from "react-router";

import { PlaceholderPage } from "~/components/ui/PlaceholderPage";
import { hasActivatedDevice } from "~/infrastructure/session/device-store";
import { resolveActivateGuardRedirect } from "~/infrastructure/session/guards";

export async function clientLoader() {
  const activated = await hasActivatedDevice();
  const redirectTo = resolveActivateGuardRedirect(activated);
  if (redirectTo) {
    throw redirect(redirectTo);
  }
  return null;
}

export default function ActivateRoute() {
  return <PlaceholderPage title="Activate this counter" />;
}
