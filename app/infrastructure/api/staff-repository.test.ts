import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { installFakeFetch, jsonResponse } from "./fake-fetch";
import { staffRepository } from "./staff-repository";

const zainab = {
  id: 5,
  full_name: "Zainab Khan",
  initials: "ZK",
  role: "cashier",
  email: null,
  username: null,
  default_counter_id: 2,
  is_active: true,
  last_active_at: "2026-09-19T12:46:00Z",
  pin_delay_until: null,
};

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.test/api/v1");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("staffRepository", () => {
  it("lists every member from one large page", async () => {
    const fetchMock = installFakeFetch({
      "GET /users": () => jsonResponse(200, { count: 1, results: [zainab] }),
    });

    const members = await staffRepository.list();

    expect(members).toEqual([
      {
        id: 5,
        fullName: "Zainab Khan",
        initials: "ZK",
        role: "cashier",
        defaultCounterId: 2,
        isActive: true,
        lastActiveAt: "2026-09-19T12:46:00Z",
        pinDelayUntil: null,
      },
    ]);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("page_size=100");
  });

  it("creates a cashier with the contract body and sends only changed fields", async () => {
    const bodies: unknown[] = [];
    installFakeFetch({
      "POST /users": (body) => {
        bodies.push(body);
        return jsonResponse(201, zainab);
      },
      "PATCH /users/5": (body) => {
        bodies.push(body);
        return jsonResponse(200, zainab);
      },
    });

    await staffRepository.createCashier({
      fullName: "Zainab Khan",
      pin: "1234",
      defaultCounterId: 2,
    });
    await staffRepository.update(5, { isActive: false });

    expect(bodies).toEqual([
      {
        full_name: "Zainab Khan",
        role: "cashier",
        pin: "1234",
        default_counter_id: 2,
      },
      { is_active: false },
    ]);
  });

  it("returns the new PIN from a reset", async () => {
    installFakeFetch({
      "POST /users/5/reset-pin": () => jsonResponse(200, { pin: "4821" }),
    });

    expect(await staffRepository.resetPin(5)).toBe("4821");
  });
});
