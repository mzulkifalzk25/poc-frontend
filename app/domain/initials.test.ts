import { describe, expect, it } from "vitest";

import { getInitials } from "./initials";

describe("getInitials", () => {
  it("takes the first letter of the first two words", () => {
    expect(getInitials("Sana Ahmed")).toBe("SA");
  });

  it("handles a single name", () => {
    expect(getInitials("Zainab")).toBe("Z");
  });

  it("collapses extra whitespace", () => {
    expect(getInitials("  Bilal   Raza  ")).toBe("BR");
  });

  it("returns an empty string for empty input", () => {
    expect(getInitials("")).toBe("");
  });
});
