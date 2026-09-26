import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { billUpload } from "../db/test-database";
import { saveDeviceMeta } from "../session/device-store";
import { setSession } from "../session/session-store";
import { installFakeFetch, jsonResponse } from "./fake-fetch";
import { uploadApi } from "./upload-api";

beforeEach(async () => {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.test/api/v1");
  localStorage.clear();
  sessionStorage.clear();
  await saveDeviceMeta({
    token: "device-token",
    counter: { id: 2, name: "Counter 2", code: "002" },
    activatedAt: "2026-09-26T03:00:00Z",
    revokedAt: null,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("upload API", () => {
  it("posts bills with the counter id and reads the results", async () => {
    setSession({
      role: "cashier",
      accessToken: "",
      refreshToken: "",
      userId: 12,
      fullName: "Zainab Khan",
      offline: true,
    });
    const bodies: unknown[] = [];
    const fetchMock = installFakeFetch({
      "POST /bills/batch": (body) => {
        bodies.push(body);
        return jsonResponse(200, {
          server_time: "2026-09-26T10:00:00Z",
          results: [
            { id: "b1", status: "created", bill_no: "002000743", flags: [] },
          ],
        });
      },
    });

    const results = await uploadApi.sendBills(2, [billUpload("b1")]);

    expect(results).toEqual([{ id: "b1", status: "created", errors: [] }]);
    expect(bodies).toEqual([{ counter_id: 2, bills: [billUpload("b1")] }]);
    expect(
      new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get("Authorization"),
    ).toBe("Device device-token");
  });

  it("posts audit events", async () => {
    installFakeFetch({
      "POST /audit/events/batch": () =>
        jsonResponse(200, {
          results: [
            { id: "e1", status: "rejected", errors: ["action: not allowed"] },
          ],
        }),
    });

    await expect(
      uploadApi.sendEvents([
        {
          id: "e1",
          action: "pin_failure",
          occurred_at: "2026-09-26T10:00:00Z",
        },
      ]),
    ).resolves.toEqual([
      { id: "e1", status: "rejected", errors: ["action: not allowed"] },
    ]);
  });
});
