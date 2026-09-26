import { configureDeviceRevokedHandler } from "~/infrastructure/api/client";

import { markDeviceRevoked } from "./device-store";

export function installDeviceRevokedHandler(onRevoked: () => void): void {
  configureDeviceRevokedHandler(async () => {
    await markDeviceRevoked(new Date());
    onRevoked();
  });
}

export function uninstallDeviceRevokedHandler(): void {
  configureDeviceRevokedHandler(null);
}
