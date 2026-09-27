import type { StoreSettings } from "~/domain/store-settings";
import type { SettingsRepository } from "~/use_cases/manage-settings";

import { apiClient } from "./client";
import { toStoreSettings, type SettingsDto } from "./counter-sync-api";

function toBody(settings: StoreSettings) {
  return {
    store_name: settings.storeName,
    phone: settings.phone,
    address: settings.address,
    tax_rate: settings.taxRate,
    prices_include_tax: settings.pricesIncludeTax,
    block_when_out_of_stock: settings.blockWhenOutOfStock,
    receipt_paper_mm: settings.receiptPaperMm,
    receipt_header: settings.receiptHeader,
    receipt_footer: settings.receiptFooter,
    receipt_show_barcode: settings.receiptShowBarcode,
  };
}

export const settingsRepository: SettingsRepository = {
  load: async () =>
    toStoreSettings(await apiClient.get<SettingsDto>("/tenant/settings")),
  save: async (settings) =>
    toStoreSettings(
      await apiClient.patch<SettingsDto>("/tenant/settings", toBody(settings)),
    ),
};
