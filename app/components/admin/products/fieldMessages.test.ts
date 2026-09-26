import { describe, expect, it } from "vitest";

import { fieldMessages } from "./fieldMessages";

describe("fieldMessages", () => {
  it("turns local codes into messages", () => {
    expect(
      fieldMessages({ price: "required", cost: "invalid_amount" }),
    ).toEqual({
      price: "Fill this in.",
      cost: "Enter a number, 0 or more.",
    });
  });

  it("renames server fields to the form names", () => {
    expect(
      fieldMessages({}, { low_stock_alert: "Too big.", category_id: "Gone." }),
    ).toEqual({ lowStockAlert: "Too big.", categoryId: "Gone." });
  });
});
