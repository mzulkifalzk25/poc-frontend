import { describe, expect, it } from "vitest";

import { activityTypeFrom } from "./activity";

describe("activityTypeFrom", () => {
  it("accepts the known filter groups and falls back to all", () => {
    expect(activityTypeFrom("refund")).toBe("refund");
    expect(activityTypeFrom("shift")).toBe("shift");
    expect(activityTypeFrom("weird")).toBe("all");
    expect(activityTypeFrom(null)).toBe("all");
  });
});
