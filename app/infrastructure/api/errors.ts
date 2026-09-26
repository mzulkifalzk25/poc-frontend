export const DEVICE_REVOKED = "device_revoked";

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
    retry_after?: number;
  };
  retry_after?: number;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string[]>;
  readonly retryAfterSeconds?: number;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.error.code;
    this.fields = body.error.fields;
    this.retryAfterSeconds = body.retry_after ?? body.error.retry_after;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
