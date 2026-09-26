import { uploadPendingShifts } from "~/use_cases/upload-shifts";
import type { UploadDeps } from "~/use_cases/upload-outbox";

import { uploadApi } from "../api/upload-api";
import { auditOutbox, billsOutbox, returnsOutbox } from "../db/outbox-store";
import { getDeviceCounter } from "../session/device-store";
import { uploadShiftsDeps } from "./shift-deps";

export const uploadDeps: UploadDeps = {
  api: uploadApi,
  bills: billsOutbox,
  returns: returnsOutbox,
  audit: auditOutbox,
  counterId: async () => (await getDeviceCounter())?.id ?? null,
  uploadShifts: () => uploadPendingShifts(uploadShiftsDeps),
  now: () => Date.now(),
  random: () => Math.random(),
};
