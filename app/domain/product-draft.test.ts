import { describe, expect, it } from "vitest";

import {
  parseAmountInput,
  validateNewProduct,
  validateProductEdit,
  type ProductEditDraft,
} from "./product-draft";

const draft: ProductEditDraft = {
  name: "  Cooking   Oil 1L ",
  categoryId: 1,
  unit: "litre",
  price: "620",
  cost: "570",
  lowStockAlert: "15",
};

describe("parseAmountInput", () => {
  it("turns typed amounts into API strings", () => {
    expect(parseAmountInput("1,650", 2)).toBe("1650.00");
    expect(parseAmountInput(" 620.5 ", 2)).toBe("620.50");
    expect(parseAmountInput("15", 3)).toBe("15.000");
    expect(parseAmountInput("0", 2)).toBe("0.00");
  });

  it.each(["", "-5", "abc", "1.2.3", "Rs 50"])("rejects %j", (text) => {
    expect(parseAmountInput(text, 2)).toBeNull();
  });
});

describe("validateProductEdit", () => {
  it("builds a clean payload from a valid draft", () => {
    expect(validateProductEdit(draft)).toEqual({
      ok: true,
      payload: {
        name: "Cooking Oil 1L",
        categoryId: 1,
        unit: "litre",
        price: "620.00",
        cost: "570.00",
        lowStockAlert: "15.000",
      },
    });
  });

  it("reports every missing or wrong field", () => {
    expect(
      validateProductEdit({
        name: " ",
        categoryId: null,
        unit: "",
        price: "",
        cost: "-1",
        lowStockAlert: "ten",
      }),
    ).toEqual({
      ok: false,
      fields: {
        name: "required",
        categoryId: "required",
        unit: "required",
        price: "required",
        cost: "invalid_amount",
        lowStockAlert: "invalid_amount",
      },
    });
  });

  it("allows a cost above the price, which only lowers the profit", () => {
    expect(validateProductEdit({ ...draft, cost: "700" }).ok).toBe(true);
  });
});

describe("validateNewProduct", () => {
  const fresh = {
    ...draft,
    name: "Wafer Chocolate 40g",
    barcode: "8961011200111",
    stock: "",
  };

  it("starts an empty stock at zero", () => {
    expect(validateNewProduct(fresh)).toEqual({
      ok: true,
      payload: {
        name: "Wafer Chocolate 40g",
        categoryId: 1,
        unit: "litre",
        price: "620.00",
        cost: "570.00",
        lowStockAlert: "15.000",
        barcode: "8961011200111",
        stock: "0.000",
      },
    });
  });

  it("keeps a typed opening stock", () => {
    const result = validateNewProduct({ ...fresh, stock: "24" });

    expect(result.ok && result.payload.stock).toBe("24.000");
  });

  it("reports the barcode and stock with the other fields", () => {
    expect(
      validateNewProduct({ ...fresh, barcode: "12", stock: "-2", name: "" }),
    ).toEqual({
      ok: false,
      fields: {
        name: "required",
        barcode: "invalid_barcode",
        stock: "invalid_amount",
      },
    });
  });

  it("needs a barcode", () => {
    expect(validateNewProduct({ ...fresh, barcode: "" })).toEqual({
      ok: false,
      fields: { barcode: "required" },
    });
  });
});
