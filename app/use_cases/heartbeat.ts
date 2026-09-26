import { clockOffsetMs } from "~/domain/clock";

export interface HeartbeatBody {
  unsyncedCount: number;
  cashierId: number | null;
  appVersion: string;
}

export interface HeartbeatDeps {
  send: (counterId: number, body: HeartbeatBody) => Promise<string>;
  counterId: () => Promise<number | null>;
  cashierId: () => number | null;
  countUnsynced: () => Promise<number>;
  recordClockOffset: (offsetMs: number) => Promise<void>;
  appVersion: string;
  nowMs: () => number;
}

// Tells the server this counter is alive and how many sales wait; sets the clock offset.
export async function sendHeartbeat(deps: HeartbeatDeps): Promise<boolean> {
  const counterId = await deps.counterId();
  if (counterId === null) {
    return false;
  }
  const body: HeartbeatBody = {
    unsyncedCount: await deps.countUnsynced(),
    cashierId: deps.cashierId(),
    appVersion: deps.appVersion,
  };
  const sentAt = deps.nowMs();
  const serverTime = await deps.send(counterId, body);
  await deps.recordClockOffset(clockOffsetMs(serverTime, sentAt, deps.nowMs()));
  return true;
}
