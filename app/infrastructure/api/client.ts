import { getDeviceToken } from "~/infrastructure/session/device-store";

import { ApiError, DEVICE_REVOKED, type ApiErrorBody } from "./errors";

export interface TokenProvider {
  getAccessToken: () => string | null;
  refresh: () => Promise<boolean>;
}

let tokenProvider: TokenProvider | null = null;

export function configureApiClient(provider: TokenProvider | null): void {
  tokenProvider = provider;
}

let deviceRevokedHandler: (() => Promise<void>) | null = null;

export function configureDeviceRevokedHandler(
  handler: (() => Promise<void>) | null,
): void {
  deviceRevokedHandler = handler;
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";
type TokenSource = "user" | "device" | "none";

interface RequestOptions {
  method?: Method;
  body?: unknown;
  tokenSource?: TokenSource;
  headers?: Record<string, string>;
  as?: "json" | "blob";
}

// Users send `Bearer <jwt>`; an activated counter PC sends `Device <token>`.
async function resolveAuthorization(
  tokenSource: TokenSource,
): Promise<string | null> {
  if (tokenSource === "none") {
    return null;
  }
  if (tokenSource === "device") {
    const token = await getDeviceToken();
    return token ? `Device ${token}` : null;
  }
  const token = tokenProvider ? tokenProvider.getAccessToken() : null;
  return token ? `Bearer ${token}` : null;
}

async function sendRequest(
  path: string,
  method: Method,
  body: unknown,
  tokenSource: TokenSource,
  extraHeaders: Record<string, string> = {},
): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...extraHeaders,
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const authorization = await resolveAuthorization(tokenSource);
  if (authorization) {
    headers.Authorization = authorization;
  }
  return fetch(`${import.meta.env.VITE_API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function parseResponse<T>(
  response: Response,
  as: "json" | "blob" = "json",
): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }
  if (as === "blob" && response.ok) {
    return (await response.blob()) as T;
  }
  const data: unknown = await response.json();
  if (!response.ok) {
    const error = new ApiError(response.status, data as ApiErrorBody);
    if (error.code === DEVICE_REVOKED && deviceRevokedHandler) {
      await deviceRevokedHandler();
    }
    throw error;
  }
  return data as T;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    tokenSource = "user",
    headers,
    as = "json",
  } = options;
  const response = await sendRequest(path, method, body, tokenSource, headers);

  if (response.status === 401 && tokenSource === "user" && tokenProvider) {
    const refreshed = await tokenProvider.refresh();
    if (refreshed) {
      const retryResponse = await sendRequest(
        path,
        method,
        body,
        tokenSource,
        headers,
      );
      return parseResponse<T>(retryResponse, as);
    }
  }

  return parseResponse<T>(response, as);
}

type NoBodyOptions = Omit<RequestOptions, "method" | "body">;

export const apiClient = {
  get: <T>(path: string, options?: NoBodyOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: NoBodyOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: NoBodyOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: NoBodyOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
