import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { installFakeFetch, jsonResponse } from "./fake-fetch";
import { staffRepository } from "./staff-repository";

const zainab = {
  id: 5,
  full_name: "Zainab Khan",
  initials: "ZK",
  role: "cashier",
  email: "zainab@example.com",
  username: null,
  default_counter_id: 2,
  is_active: true,
  last_active_at: "2026-09-19T12:46:00Z",
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
        email: "zainab@example.com",
        username: null,
        defaultCounterId: 2,
        isActive: true,
        lastActiveAt: "2026-09-19T12:46:00Z",
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
      email: "zainab@example.com",
      username: "",
      password: "pw-482134",
      defaultCounterId: 2,
    });
    await staffRepository.update(5, { isActive: false });

    expect(bodies).toEqual([
      {
        full_name: "Zainab Khan",
        role: "cashier",
        email: "zainab@example.com",
        username: undefined,
        password: "pw-482134",
        default_counter_id: 2,
      },
      { is_active: false },
    ]);
  });

  it("returns the new password from a reset", async () => {
    installFakeFetch({
      "POST /users/5/reset-password": () =>
        jsonResponse(200, { password: "Blue-Kettle-42" }),
    });

    expect(await staffRepository.resetPassword(5)).toBe("Blue-Kettle-42");
  });
});
