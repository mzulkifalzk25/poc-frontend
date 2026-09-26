import type { StartShiftDeps } from "~/use_cases/start-shift";
import { isFirstSyncDone } from "~/use_cases/sync-catalogue";
import type { UploadShiftsDeps } from "~/use_cases/upload-shifts";

import { shiftApi } from "../api/shift-api";
import { counterClock } from "../clock";
import { metaStore } from "../db/meta-store";
import { shiftStore } from "../db/shift-store";
import { getDeviceCounter } from "../session/device-store";

export const startShiftDeps: StartShiftDeps = {
  shifts: shiftStore,
  firstSyncDone: () => isFirstSyncDone(metaStore),
  counterId: async () => (await getDeviceCounter())?.id ?? null,
  now: () => counterClock.now(),
  newId: () => crypto.randomUUID(),
};

export const uploadShiftsDeps: UploadShiftsDeps = {
  shifts: shiftStore,
  api: shiftApi,
};
