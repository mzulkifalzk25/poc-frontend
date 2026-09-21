import { beforeEach, describe, expect, it } from "vitest";

import {
  getDeviceCounter,
  getDeviceToken,
  hasActivatedDevice,
  setDeviceCounter,
  setDeviceToken,
} from "./device-store";

beforeEach(() => {
  localStorage.clear();
});

describe("device-store", () => {
  it("has no device token by default", async () => {
    expect(getDeviceToken()).toBeNull();
    await expect(hasActivatedDevice()).resolves.toBe(false);
  });

  it("stores and reports an activated device", async () => {
    setDeviceToken("device-token-1");

    expect(getDeviceToken()).toBe("device-token-1");
    await expect(hasActivatedDevice()).resolves.toBe(true);
  });

  it("clears the device token", async () => {
    setDeviceToken("device-token-1");
    setDeviceToken(null);

    await expect(hasActivatedDevice()).resolves.toBe(false);
  });

  it("has no device counter by default", () => {
    expect(getDeviceCounter()).toBeNull();
  });

  it("stores and clears the device counter", () => {
    setDeviceCounter({ name: "Counter 3", code: "003" });
    expect(getDeviceCounter()).toEqual({ name: "Counter 3", code: "003" });

    setDeviceCounter(null);
    expect(getDeviceCounter()).toBeNull();
  });
});
