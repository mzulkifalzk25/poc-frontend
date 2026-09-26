import type { CompleteSaleDeps } from "~/use_cases/complete-sale";

import { saleStore } from "../db/sale-store";
import { notifyOutboxChanged } from "./outbox-events";

export const completeSaleDeps: CompleteSaleDeps = {
  recordSale: saleStore.recordSale,
  onSaved: notifyOutboxChanged,
  now: () => Date.now(),
};
