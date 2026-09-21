import { describe, expect, it } from "vitest";

import { t } from "./t";

describe("t", () => {
  it("returns the english string dictionary", () => {
    expect(t().common.online).toBe("Online");
  });
});
