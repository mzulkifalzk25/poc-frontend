import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { counterRepository } from "./counter-repository";
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

describe("counterRepository", () => {
  it("maps the counters list", async () => {
    installFakeFetch({
      "GET /counters": () => jsonResponse(200, [counterTwo]),
    });

    expect(await counterRepository.list()).toEqual([
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

describe("counterRepository writes", () => {
  it("creates, issues and revokes codes and deactivates by the contract", async () => {
    const calls: string[] = [];
    installFakeFetch({
      "POST /counters": (body) => {
        calls.push(`create ${JSON.stringify(body)}`);
        return jsonResponse(201, { ...counterTwo, id: 4, code: "004" });
      },
      "POST /devices/codes": (body) => {
        calls.push(`code ${JSON.stringify(body)}`);
        return jsonResponse(201, {
          code: "K7M4-Q92R",
          expires_at: "2026-09-19T12:15:00Z",
        });
      },
      "DELETE /devices/codes/4": () => {
        calls.push("revoke");
        return jsonResponse(204);
      },
      "POST /counters/4/deactivate": () => {
        calls.push("deactivate");
        return jsonResponse(204);
      },
    });

    await counterRepository.create({ name: "Counter 4", code: "004" });
    const issued = await counterRepository.generateCode(4);
    await counterRepository.revokeCode(4);
    await counterRepository.deactivate(4);

    expect(issued).toEqual({
      counterId: 4,
      code: "K7M4-Q92R",
      expiresAt: "2026-09-19T12:15:00Z",
    });
    expect(calls).toEqual([
      'create {"name":"Counter 4","code":"004"}',
      'code {"counter_id":4}',
      "revoke",
      "deactivate",
    ]);
  });
});
