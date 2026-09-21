import type { AuthSession } from "./session-store";

export function resolveAdminGuardRedirect(
  session: AuthSession | null,
): string | null {
  if (!session || (session.role !== "owner" && session.role !== "manager")) {
    return "/";
  }
  return null;
}

export function resolvePosGuardRedirect(
  deviceActivated: boolean,
  session: AuthSession | null,
): string | null {
  if (!deviceActivated) {
    return "/pos/activate";
  }
  if (!session || session.role !== "cashier") {
    return "/pos/sign-in";
  }
  return null;
}

export function resolveActivateGuardRedirect(
  deviceActivated: boolean,
): string | null {
  return deviceActivated ? "/pos/sign-in" : null;
}

export function resolvePosSignInGuardRedirect(
  deviceActivated: boolean,
): string | null {
  return deviceActivated ? null : "/pos/activate";
}
