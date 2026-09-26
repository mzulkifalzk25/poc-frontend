import type { HeartbeatDeps } from "~/use_cases/heartbeat";

import { apiClient } from "../api/client";
import { APP_VERSION } from "../app-version";
import { counterClock } from "../clock";
import { billsOutbox, returnsOutbox } from "../db/outbox-store";
import { getDeviceCounter } from "../session/device-store";
import { getSession } from "../session/session-store";

export async function countUnsyncedSales(): Promise<number> {
  return (await billsOutbox.count()) + (await returnsOutbox.count());
}

export const heartbeatDeps: HeartbeatDeps = {
  send: async (counterId, body) => {
    const answer = await apiClient.post<{ server_time: string }>(
      `/counters/${String(counterId)}/heartbeat`,
      {
        unsynced_count: body.unsyncedCount,
        cashier_id: body.cashierId,
        app_version: body.appVersion,
      },
      { tokenSource: "device" },
    );
    return answer.server_time;
  },
  counterId: async () => (await getDeviceCounter())?.id ?? null,
  cashierId: () => {
    const session = getSession();
    return session?.role === "cashier" ? session.userId : null;
  },
  countUnsynced: countUnsyncedSales,
  recordClockOffset: (offsetMs) => counterClock.record(offsetMs),
  appVersion: APP_VERSION,
  nowMs: () => Date.now(),
};
