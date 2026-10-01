import { describe, expect, it } from "vitest";

import { checkPasswordChange } from "./password-change";

describe("checkPasswordChange", () => {
  it("accepts a new password typed twice", () => {
    expect(
      checkPasswordChange({
        current: "old",
        next: "new-one",
        again: "new-one",
      }),
    ).toEqual({});
  });

  it("asks for the current and the new password", () => {
    expect(checkPasswordChange({ current: "", next: "", again: "" })).toEqual({
      current: "required",
      next: "required",
    });
  });

  it("flags a mismatch and an unchanged password", () => {
    expect(
      checkPasswordChange({ current: "old", next: "new-one", again: "other" }),
    ).toEqual({ again: "mismatch" });
    expect(
      checkPasswordChange({ current: "old", next: "old", again: "old" }),
    ).toEqual({ next: "same" });
  });
});
