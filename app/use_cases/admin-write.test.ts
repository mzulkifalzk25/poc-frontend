import { describe, expect, it } from "vitest";

import { ApiError } from "~/infrastructure/api/errors";

import { runAdminWrite } from "./admin-write";

function reject(
  status: number,
  code: string,
  fields?: Record<string, string[]>,
) {
  return () =>
    Promise.reject(
      new ApiError(status, {
        error: { code, message: `${code} message`, fields },
      }),
    );
}

describe("runAdminWrite", () => {
  it("wraps the saved value", async () => {
    await expect(runAdminWrite(() => Promise.resolve(7))).resolves.toEqual({
      status: "done",
      value: 7,
    });
  });

  it("keeps the first message of each invalid field", async () => {
    const outcome = await runAdminWrite(
      reject(400, "validation_error", {
        name: ["This name is taken.", "Too long."],
        tint: [],
      }),
    );

    expect(outcome).toEqual({
      status: "invalid",
      fields: { name: "This name is taken." },
    });
  });

  it("reports a conflict with its code", async () => {
    const outcome = await runAdminWrite(reject(409, "barcode_exists"));

    expect(outcome).toEqual({
      status: "conflict",
      code: "barcode_exists",
      message: "barcode_exists message",
    });
  });

  it("reports offline on a network failure", async () => {
    const outcome = await runAdminWrite(() =>
      Promise.reject(new TypeError("Failed to fetch")),
    );

    expect(outcome).toEqual({ status: "offline" });
  });

  it("reports other API errors as failed", async () => {
    const outcome = await runAdminWrite(reject(500, "server_error"));

    expect(outcome).toEqual({
      status: "failed",
      message: "server_error message",
    });
  });

  it("rethrows errors that are not from the API", async () => {
    await expect(
      runAdminWrite(() => Promise.reject(new Error("bug"))),
    ).rejects.toThrow("bug");
  });
});
