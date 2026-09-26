import { vi } from "vitest";

// Test helper: answers fetch calls by "METHOD /path" (query string ignored).
export type FakeRoute = (body: unknown, url: URL) => Response | Error;

export function jsonResponse(status: number, body?: unknown): Response {
  if (body === undefined) {
    return new Response(null, { status });
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function installFakeFetch(routes: Record<string, FakeRoute>) {
  const fetchMock = vi.fn((input: string, init?: RequestInit) => {
    const url = new URL(input);
    const path = url.pathname.replace(/^\/api\/v1/, "");
    const key = `${init?.method ?? "GET"} ${path}`;
    const route = routes[key];
    if (!route) {
      return Promise.reject(new Error(`No fake route for ${key}`));
    }
    const body: unknown =
      typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
    const answer = route(body, url);
    return answer instanceof Error
      ? Promise.reject(answer)
      : Promise.resolve(answer);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
