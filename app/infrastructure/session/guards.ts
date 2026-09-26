import type { DeviceStatus } from "./device-store";
import type { AuthSession } from "./session-store";

export function resolveAdminGuardRedirect(
  session: AuthSession | null,
): string | null {
  if (!session || (session.role !== "owner" && session.role !== "manager")) {
    return "/";
  }
  return null;
}

function resolveDeviceRedirect(device: DeviceStatus): string | null {
  if (device === "none") {
    return "/pos/activate";
  }
  return device === "revoked" ? "/pos/deactivated" : null;
}

export function resolvePosGuardRedirect(
  device: DeviceStatus,
  session: AuthSession | null,
): string | null {
  const deviceRedirect = resolveDeviceRedirect(device);
  if (deviceRedirect) {
    return deviceRedirect;
  }
  return session?.role === "cashier" ? null : "/";
}

export function resolveActivateGuardRedirect(
  device: DeviceStatus,
): string | null {
  if (device === "revoked") {
    return "/pos/deactivated";
  }
  return device === "active" ? "/" : null;
}

export function resolveDeactivatedGuardRedirect(
  device: DeviceStatus,
): string | null {
  return device === "revoked" ? null : "/";
}
