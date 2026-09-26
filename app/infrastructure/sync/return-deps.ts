import type { ProcessReturnDeps } from "~/use_cases/process-return";

import { returnStore } from "../db/return-store";
import { notifyOutboxChanged } from "./outbox-events";

export const processReturnDeps: ProcessReturnDeps = {
  recordReturn: returnStore.recordReturn,
  onSaved: notifyOutboxChanged,
  now: () => Date.now(),
};
