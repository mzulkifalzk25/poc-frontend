import { describe, expect, it } from "vitest";

import { withOverlap } from "./sync-cursor";

describe("withOverlap", () => {
  it("starts from 0 the first time", () => {
    expect(withOverlap(null)).toBe("0");
    expect(withOverlap("0")).toBe("0");
  });

  it("moves a timestamp cursor back 10 seconds", () => {
    expect(withOverlap("2026-09-26T10:00:05Z")).toBe(
      "2026-09-26T09:59:55.000Z",
    );
  });

  it("leaves any other cursor as it is", () => {
    expect(withOverlap("c:48213")).toBe("c:48213");
    expect(withOverlap("1727344800")).toBe("1727344800");
  });
});
