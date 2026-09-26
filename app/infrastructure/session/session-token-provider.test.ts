import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient, configureApiClient } from "../api/client";
import { installFakeFetch, jsonResponse } from "../api/fake-fetch";
import { getSession, setSession } from "./session-store";
import { createSessionTokenProvider } from "./session-token-provider";

const owner = {
  role: "owner" as const,
  accessToken: "old-access",
  refreshToken: "old-refresh",
  userId: 1,
  fullName: "Sana Ahmed",
};

function authorization(
  fetchMock: ReturnType<typeof installFakeFetch>,
  call: number,
) {
  const init = fetchMock.mock.calls[call]?.[1];
  return new Headers(init?.headers).get("Authorization");
}

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.test/api/v1");
  localStorage.clear();
  sessionStorage.clear();
  configureApiClient(createSessionTokenProvider());
});

afterEach(() => {
  configureApiClient(null);
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("session token provider", () => {
  it("sends the signed-in user's token", async () => {
    setSession(owner);
    const fetchMock = installFakeFetch({
      "GET /categories": () => jsonResponse(200, []),
    });

    await apiClient.get("/categories");

    expect(authorization(fetchMock, 0)).toBe("Bearer old-access");
  });

  it("refreshes once after a 401 and keeps the session where it was", async () => {
    setSession(owner, true);
    let calls = 0;
    const fetchMock = installFakeFetch({
      "GET /categories": () => {
        calls += 1;
        return calls === 1
          ? jsonResponse(401, {
              error: { code: "token_expired", message: "Expired" },
            })
          : jsonResponse(200, []);
      },
      "POST /auth/refresh": (body) => {
        expect(body).toEqual({ refresh: "old-refresh" });
        return jsonResponse(200, {
          access: "new-access",
          refresh: "new-refresh",
        });
      },
    });

    await apiClient.get("/categories");

    expect(authorization(fetchMock, 2)).toBe("Bearer new-access");
    expect(getSession()).toMatchObject({
      accessToken: "new-access",
      refreshToken: "new-refresh",
    });
    expect(localStorage.getItem("martdesk.session")).not.toBeNull();
  });

  it("sends no token when nobody is signed in", async () => {
    const fetchMock = installFakeFetch({
      "GET /categories": () => jsonResponse(200, []),
    });

    await apiClient.get("/categories");

    expect(authorization(fetchMock, 0)).toBeNull();
  });

  it("gives up when the refresh token is refused", async () => {
    setSession(owner);
    installFakeFetch({
      "GET /categories": () =>
        jsonResponse(401, {
          error: { code: "token_expired", message: "Expired" },
        }),
      "POST /auth/refresh": () =>
        jsonResponse(401, {
          error: { code: "token_invalid", message: "Invalid" },
        }),
    });

    await expect(apiClient.get("/categories")).rejects.toMatchObject({
      status: 401,
    });
    expect(getSession()?.accessToken).toBe("old-access");
  });
});
