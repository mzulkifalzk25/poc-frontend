import { describe, expect, it } from "vitest";

import { t } from "./t";

describe("t", () => {
  it("returns the english string dictionary", () => {
    expect(t().common.online).toBe("Online");
  });
});

describe("sign-in wait message", () => {
  it("shows seconds under a minute", () => {
    expect(t().signIn.cashier.throttledWait(30)).toBe(
      "Wait 30 s, then try again.",
    );
  });

  it("shows whole minutes and leftover seconds", () => {
    expect(t().signIn.cashier.throttledWait(60)).toBe(
      "Wait 1 min, then try again.",
    );
    expect(t().signIn.cashier.throttledWait(299)).toBe(
      "Wait 4 min 59 s, then try again.",
    );
  });
});
