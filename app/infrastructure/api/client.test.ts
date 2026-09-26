import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setDeviceToken } from "~/infrastructure/session/device-store";

import { apiClient, configureApiClient } from "./client";
import { isApiError } from "./errors";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("apiClient", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.test");
  });

  afterEach(() => {
    configureApiClient(null);
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("parses a successful json response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(200, { ok: true })),
    );

    const result = await apiClient.get<{ ok: boolean }>("/me");

    expect(result).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.test/me",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("throws an ApiError with the error shape on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(400, {
          error: { code: "invalid_pin", message: "Wrong PIN", fields: {} },
        }),
      ),
    );

    await expect(apiClient.post("/auth/pin-login", {})).rejects.toSatisfy(
      (error: unknown) =>
        isApiError(error) &&
        error.code === "invalid_pin" &&
        error.status === 400,
    );
  });

  it("refreshes the token once and retries after a 401", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(401, {
          error: { code: "token_expired", message: "Expired" },
        }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    configureApiClient({
      getAccessToken: () => "old-token",
      refresh: vi.fn().mockResolvedValue(true),
    });

    const result = await apiClient.get<{ ok: boolean }>("/products");

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry when the refresh fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(401, {
        error: { code: "token_expired", message: "Expired" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    configureApiClient({
      getAccessToken: () => "old-token",
      refresh: vi.fn().mockResolvedValue(false),
    });

    await expect(apiClient.get("/products")).rejects.toSatisfy(
      (error: unknown) => isApiError(error) && error.code === "token_expired",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sends the device token for device-scoped requests", async () => {
    setDeviceToken("device-token-1");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, [])));

    await apiClient.get("/pos/roster", { tokenSource: "device" });

    expect(fetch).toHaveBeenCalledWith(
      "https://api.test/pos/roster",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer device-token-1",
        }) as Record<string, string>,
      }),
    );
  });

  it("sends no authorization header for public requests", async () => {
    configureApiClient({
      getAccessToken: () => "user-token",
      refresh: vi.fn(),
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(200, { ok: true })),
    );

    await apiClient.post("/auth/login", {}, { tokenSource: "none" });

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(
      (init.headers as Record<string, string>).Authorization,
    ).toBeUndefined();
  });
});
