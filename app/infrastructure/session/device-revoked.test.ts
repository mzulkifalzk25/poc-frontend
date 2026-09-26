import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "~/infrastructure/api/client";

import {
  installDeviceRevokedHandler,
  uninstallDeviceRevokedHandler,
} from "./device-revoked";
import {
  clearDeviceMeta,
  getDeviceStatus,
  saveDeviceMeta,
} from "./device-store";

beforeEach(async () => {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.test");
  await clearDeviceMeta();
  await saveDeviceMeta({
    token: "device-1",
    counter: { id: 2, name: "Counter 2", code: "002" },
    activatedAt: "2026-09-26T10:00:00Z",
    revokedAt: null,
  });
});

afterEach(() => {
  uninstallDeviceRevokedHandler();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("installDeviceRevokedHandler", () => {
  it("marks the device revoked and calls back on a device_revoked answer", async () => {
    const onRevoked = vi.fn();
    installDeviceRevokedHandler(onRevoked);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { code: "device_revoked", message: "Deactivated" },
          }),
          { status: 401 },
        ),
      ),
    );

    await expect(
      apiClient.get("/pos/roster", { tokenSource: "device" }),
    ).rejects.toThrow();

    expect(await getDeviceStatus()).toBe("revoked");
    expect(onRevoked).toHaveBeenCalledTimes(1);
  });
});
