import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { listCounters } from "./counter-repository";
import { installFakeFetch, jsonResponse } from "./fake-fetch";

const counterTwo = {
  id: 2,
  name: "Counter 2",
  code: "002",
  is_active: true,
  status: "activated",
  code_expires_at: null,
  last_seen_at: "2026-09-19T12:46:00Z",
  app_version: "1.0.0",
  last_bill_seq: 742,
  next_bill_no: "002000743",
  unsynced_count: 0,
  has_open_shift: true,
  has_bills: true,
};

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.test/api/v1");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("listCounters", () => {
  it("maps the counters list", async () => {
    installFakeFetch({
      "GET /counters": () => jsonResponse(200, [counterTwo]),
    });

    expect(await listCounters()).toEqual([
      {
        id: 2,
        name: "Counter 2",
        code: "002",
        status: "activated",
        codeExpiresAt: null,
        lastSeenAt: "2026-09-19T12:46:00Z",
        nextBillNo: "002000743",
        unsyncedCount: 0,
        hasOpenShift: true,
        hasBills: true,
      },
    ]);
  });
});
