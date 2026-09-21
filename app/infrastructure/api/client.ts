import { ApiError, type ApiErrorBody } from "./errors";

export interface TokenProvider {
  getAccessToken: () => string | null;
  refresh: () => Promise<boolean>;
}

let tokenProvider: TokenProvider | null = null;

export function configureApiClient(provider: TokenProvider | null): void {
  tokenProvider = provider;
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: Method;
  body?: unknown;
  auth?: boolean;
}

async function sendRequest(
  path: string,
  method: Method,
  body: unknown,
  auth: boolean,
): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (auth && tokenProvider) {
    const token = tokenProvider.getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  return fetch(`${import.meta.env.VITE_API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }
  const data: unknown = await response.json();
  if (!response.ok) {
    throw new ApiError(response.status, data as ApiErrorBody);
  }
  return data as T;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const response = await sendRequest(path, method, body, auth);

  if (response.status === 401 && auth && tokenProvider) {
    const refreshed = await tokenProvider.refresh();
    if (refreshed) {
      const retryResponse = await sendRequest(path, method, body, auth);
      return parseResponse<T>(retryResponse);
    }
  }

  return parseResponse<T>(response);
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
