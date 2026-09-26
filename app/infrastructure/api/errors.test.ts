import { describe, expect, it } from "vitest";

import { ApiError } from "./errors";

describe("ApiError", () => {
  it("reads retry_after next to the error object", () => {
    const error = new ApiError(429, {
      error: { code: "pin_throttled", message: "Wait" },
      retry_after: 30,
    });

    expect(error.retryAfterSeconds).toBe(30);
  });

  it("reads retry_after inside the error object", () => {
    const error = new ApiError(429, {
      error: { code: "pin_throttled", message: "Wait", retry_after: 60 },
    });

    expect(error.retryAfterSeconds).toBe(60);
  });
});
