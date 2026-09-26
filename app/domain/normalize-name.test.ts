import { describe, expect, it } from "vitest";

import { normalizeName } from "./normalize-name";

describe("normalizeName", () => {
  it("trims, collapses spaces and lowercases", () => {
    expect(normalizeName("  Zainab   Khan  ")).toBe("zainab khan");
  });

  it("matches names that differ only in case and spacing", () => {
    expect(normalizeName("zainab khan")).toBe(normalizeName("Zainab  Khan"));
  });
});
