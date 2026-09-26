import { beforeEach, describe, expect, it } from "vitest";

import {
  clearDeviceMeta,
  getDeviceCounter,
  getDeviceMeta,
  getDeviceStatus,
  getDeviceToken,
  hasActivatedDevice,
  markDeviceRevoked,
  saveDeviceMeta,
  type DeviceMeta,
} from "./device-store";

const meta: DeviceMeta = {
  token: "device-token-1",
  counter: { id: 3, name: "Counter 3", code: "003" },
  activatedAt: "2026-09-26T10:00:00Z",
  revokedAt: null,
};

beforeEach(async () => {
  await clearDeviceMeta();
});

describe("device-store", () => {
  it("has no device by default", async () => {
    expect(await getDeviceMeta()).toBeNull();
    expect(await getDeviceToken()).toBeNull();
    expect(await getDeviceStatus()).toBe("none");
    expect(await hasActivatedDevice()).toBe(false);
  });

  it("stores and reads back the activated device", async () => {
    await saveDeviceMeta(meta);

    expect(await getDeviceToken()).toBe("device-token-1");
    expect(await getDeviceCounter()).toEqual(meta.counter);
    expect(await getDeviceStatus()).toBe("active");
    expect(await hasActivatedDevice()).toBe(true);
  });

  it("stops handing out the token once the device is revoked", async () => {
    await saveDeviceMeta({ ...meta, revokedAt: "2026-09-26T11:00:00Z" });

    expect(await getDeviceToken()).toBeNull();
    expect(await getDeviceCounter()).toEqual(meta.counter);
    expect(await getDeviceStatus()).toBe("revoked");
    expect(await hasActivatedDevice()).toBe(false);
  });

  it("marks the device revoked once and keeps the first time", async () => {
    await saveDeviceMeta(meta);

    await markDeviceRevoked(new Date("2026-09-26T12:00:00Z"));
    await markDeviceRevoked(new Date("2026-09-26T13:00:00Z"));

    expect((await getDeviceMeta())?.revokedAt).toBe("2026-09-26T12:00:00.000Z");
    expect(await getDeviceStatus()).toBe("revoked");
  });

  it("ignores a revoke when no device is stored", async () => {
    await markDeviceRevoked(new Date("2026-09-26T12:00:00Z"));

    expect(await getDeviceMeta()).toBeNull();
  });

  it("clears the device", async () => {
    await saveDeviceMeta(meta);
    await clearDeviceMeta();

    expect(await getDeviceMeta()).toBeNull();
  });
});
