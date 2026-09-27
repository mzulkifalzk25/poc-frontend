import type { StoreSettings } from "~/domain/store-settings";

import { runAdminWrite, type WriteOutcome } from "./admin-write";

export interface SettingsRepository {
  load: () => Promise<StoreSettings>;
  save: (settings: StoreSettings) => Promise<StoreSettings>;
}

export function saveSettings(
  repo: SettingsRepository,
  draft: StoreSettings,
): Promise<WriteOutcome<StoreSettings>> {
  return runAdminWrite(() =>
    repo.save({
      ...draft,
      storeName: draft.storeName.trim(),
      phone: draft.phone.trim(),
      address: draft.address.trim(),
      taxRate: draft.taxRate.trim(),
      receiptHeader: draft.receiptHeader.trim(),
      receiptFooter: draft.receiptFooter.trim(),
    }),
  );
}
