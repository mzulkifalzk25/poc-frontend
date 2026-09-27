import { describe, expect, it, vi } from "vitest";

import type { StoreSettings } from "~/domain/store-settings";

import { saveSettings, type SettingsRepository } from "./manage-settings";

const settings: StoreSettings = {
  storeName: " Fresh Basket Mart ",
  phone: " 0300 1234567",
  address: "Main Road ",
  taxRate: " 17 ",
  pricesIncludeTax: true,
  blockWhenOutOfStock: false,
  receiptPaperMm: 80,
  receiptHeader: " Welcome ",
  receiptFooter: "Thank you ",
  receiptShowBarcode: true,
};

describe("saveSettings", () => {
  it("saves the settings with trimmed text", async () => {
    const repo: SettingsRepository = {
      load: vi.fn(() => Promise.resolve(settings)),
      save: vi.fn((saved: StoreSettings) => Promise.resolve(saved)),
    };

    const outcome = await saveSettings(repo, settings);

    expect(repo.save).toHaveBeenCalledWith({
      ...settings,
      storeName: "Fresh Basket Mart",
      phone: "0300 1234567",
      address: "Main Road",
      taxRate: "17",
      receiptHeader: "Welcome",
      receiptFooter: "Thank you",
    });
    expect(outcome.status).toBe("done");
  });
});
