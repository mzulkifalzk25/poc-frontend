import { describe, expect, it } from "vitest";

import {
  isCompleteActivationCode,
  normalizeActivationCode,
} from "./activation-code";

describe("normalizeActivationCode", () => {
  it("uppercases and inserts the hyphen", () => {
    expect(normalizeActivationCode("k7m4q92r")).toBe("K7M4-Q92R");
  });

  it("ignores spaces, extra hyphens and other symbols", () => {
    expect(normalizeActivationCode(" k7-m4 q9_2r ")).toBe("K7M4-Q92R");
  });

  it("leaves a partial code without a trailing hyphen", () => {
    expect(normalizeActivationCode("k7m")).toBe("K7M");
    expect(normalizeActivationCode("k7m4")).toBe("K7M4");
    expect(normalizeActivationCode("k7m4q")).toBe("K7M4-Q");
  });

  it("cuts anything after eight characters", () => {
    expect(normalizeActivationCode("K7M4Q92RXYZ")).toBe("K7M4-Q92R");
  });
});

describe("isCompleteActivationCode", () => {
  it("accepts a full code", () => {
    expect(isCompleteActivationCode("K7M4-Q92R")).toBe(true);
  });

  it("rejects a partial or unformatted code", () => {
    expect(isCompleteActivationCode("K7M4-Q92")).toBe(false);
    expect(isCompleteActivationCode("K7M4Q92R")).toBe(false);
  });
});
