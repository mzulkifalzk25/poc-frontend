import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { installFakeFetch, jsonResponse } from "./fake-fetch";
import { settingsRepository } from "./settings-repository";

const dto = {
  store_name: "Fresh Basket Mart",
  phone: "0300 1234567",
  address: "Main Road",
  logo: "",
  currency: "PKR",
  tax_rate: "17.00",
  prices_include_tax: true,
  block_when_out_of_stock: false,
  receipt_paper_mm: 80,
  receipt_header: "Welcome",
  receipt_footer: "Thank you",
  receipt_show_barcode: true,
};

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "https://api.test/api/v1");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("settingsRepository", () => {
  it("loads and saves the editable settings, never the currency", async () => {
    const bodies: unknown[] = [];
    installFakeFetch({
      "GET /tenant/settings": () => jsonResponse(200, dto),
      "PATCH /tenant/settings": (body) => {
        bodies.push(body);
        return jsonResponse(200, { ...dto, receipt_paper_mm: 58 });
      },
    });

    const loaded = await settingsRepository.load();
    const saved = await settingsRepository.save({
      ...loaded,
      receiptPaperMm: 58,
    });

    expect(loaded.taxRate).toBe("17.00");
    expect(saved.receiptPaperMm).toBe(58);
    expect(bodies).toEqual([
      {
        store_name: "Fresh Basket Mart",
        phone: "0300 1234567",
        address: "Main Road",
        tax_rate: "17.00",
        prices_include_tax: true,
        block_when_out_of_stock: false,
        receipt_paper_mm: 58,
        receipt_header: "Welcome",
        receipt_footer: "Thank you",
        receipt_show_barcode: true,
      },
    ]);
  });
});
