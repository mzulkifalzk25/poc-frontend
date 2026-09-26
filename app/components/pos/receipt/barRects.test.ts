import { describe, expect, it } from "vitest";

import { barRects } from "./barRects";

describe("barRects", () => {
  it("draws every other width as a bar, starting with a bar", () => {
    expect(barRects([2, 1, 3, 2], 2)).toEqual({
      bars: [
        { x: 0, width: 4 },
        { x: 6, width: 6 },
      ],
      total: 16,
    });
  });
});
