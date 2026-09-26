import { describe, expect, it, vi } from "vitest";

import { sendHeartbeat, type HeartbeatDeps } from "./heartbeat";

function deps(overrides: Partial<HeartbeatDeps> = {}): HeartbeatDeps {
  let clock = Date.parse("2026-09-26T10:00:00.000Z");
  return {
    send: vi.fn(() => Promise.resolve("2026-09-26T10:00:30.100Z")),
    counterId: () => Promise.resolve(2),
    cashierId: () => 12,
    countUnsynced: () => Promise.resolve(4),
    recordClockOffset: vi.fn(() => Promise.resolve()),
    appVersion: "1.0.0",
    nowMs: () => {
      const now = clock;
      clock += 200;
      return now;
    },
    ...overrides,
  };
}

describe("sendHeartbeat", () => {
  it("sends the unsynced count and cashier and records the clock offset", async () => {
    const heartbeat = deps();

    await expect(sendHeartbeat(heartbeat)).resolves.toBe(true);

    expect(heartbeat.send).toHaveBeenCalledWith(2, {
      unsyncedCount: 4,
      cashierId: 12,
      appVersion: "1.0.0",
    });
    expect(heartbeat.recordClockOffset).toHaveBeenCalledWith(30_000);
  });

  it("does nothing on a PC that is not activated", async () => {
    const heartbeat = deps({ counterId: () => Promise.resolve(null) });

    await expect(sendHeartbeat(heartbeat)).resolves.toBe(false);
    expect(heartbeat.send).not.toHaveBeenCalled();
  });

  it("lets a network failure through for the scheduler to report", async () => {
    const heartbeat = deps({
      send: () => Promise.reject(new TypeError("offline")),
    });

    await expect(sendHeartbeat(heartbeat)).rejects.toThrow("offline");
  });
});
