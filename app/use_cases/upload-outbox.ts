import { retryDelayMs } from "~/domain/backoff";
import { DEVICE_REVOKED, isApiError } from "~/infrastructure/api/errors";
import type { Outbox } from "~/infrastructure/db/outbox-store";
import type {
  AuditEventUpload,
  BillUpload,
  OutboxRow,
  ReturnUpload,
} from "~/infrastructure/db/rows";

export const BATCH_SIZE = 50;

export interface BatchResult {
  id: string;
  status: "created" | "duplicate" | "rejected";
  errors: string[];
}

export interface UploadApi {
  sendBills: (counterId: number, bills: BillUpload[]) => Promise<BatchResult[]>;
  sendReturns: (returns: ReturnUpload[]) => Promise<BatchResult[]>;
  sendEvents: (events: AuditEventUpload[]) => Promise<BatchResult[]>;
}

type Queue<P extends { id: string }> = Pick<
  Outbox<P>,
  "due" | "remove" | "scheduleRetry" | "markRejected" | "countPending"
>;

export interface UploadDeps {
  api: UploadApi;
  bills: Queue<BillUpload>;
  returns: Queue<ReturnUpload>;
  audit: Queue<AuditEventUpload>;
  counterId: () => Promise<number | null>;
  uploadShifts: () => Promise<unknown>;
  now: () => number;
  random: () => number;
}

// created and duplicate leave the outbox; rejected stays for support; anything missing is retried.
async function applyResults<P extends { id: string }>(
  queue: Queue<P>,
  rows: OutboxRow<P>[],
  results: BatchResult[],
  deps: UploadDeps,
) {
  const byId = new Map(results.map((result) => [result.id, result]));
  const done = results
    .filter((result) => result.status !== "rejected")
    .map((result) => result.id);
  await queue.remove(done);
  for (const result of results.filter((item) => item.status === "rejected")) {
    await queue.markRejected(result.id, result.errors);
  }
  const missing = rows.filter((row) => !byId.has(row.id));
  if (missing.length > 0) {
    await retryLater(queue, missing, null, deps);
  }
}

async function retryLater<P extends { id: string }>(
  queue: Queue<P>,
  rows: OutboxRow<P>[],
  retryAfter: number | null,
  deps: UploadDeps,
) {
  const attempts = Math.max(...rows.map((row) => row.attempts));
  await queue.scheduleRetry(
    rows.map((row) => row.id),
    deps.now() + retryDelayMs(attempts, deps.random(), retryAfter),
  );
}

// One batch in flight: sends until nothing is due or a batch fails.
async function drain<P extends { id: string }>(
  queue: Queue<P>,
  send: (payloads: P[]) => Promise<BatchResult[]>,
  deps: UploadDeps,
) {
  let sent = 0;
  for (;;) {
    const rows = await queue.due(deps.now(), BATCH_SIZE);
    if (rows.length === 0) {
      return { sent, failed: false };
    }
    try {
      await applyResults(
        queue,
        rows,
        await send(rows.map((row) => row.payload)),
        deps,
      );
      sent += rows.length;
    } catch (error) {
      if (isApiError(error) && error.code === DEVICE_REVOKED) {
        throw error;
      }
      await retryLater(
        queue,
        rows,
        isApiError(error) ? (error.retryAfterSeconds ?? null) : null,
        deps,
      );
      return { sent, failed: true };
    }
  }
}

async function blocked<P extends { id: string }>(
  queue: Queue<P>,
  run: { failed: boolean },
) {
  return run.failed || (await queue.countPending()) > 0;
}

// Bills first, then returns, then audit events: nothing overtakes an older unsent sale.
export async function uploadOutbox(deps: UploadDeps): Promise<number> {
  const counterId = await deps.counterId();
  if (counterId === null) {
    return 0;
  }
  await deps.uploadShifts();
  const bills = await drain(
    deps.bills,
    (payloads) => deps.api.sendBills(counterId, payloads),
    deps,
  );
  if (await blocked(deps.bills, bills)) {
    return bills.sent;
  }
  const returns = await drain(
    deps.returns,
    (payloads) => deps.api.sendReturns(payloads),
    deps,
  );
  if (await blocked(deps.returns, returns)) {
    return bills.sent + returns.sent;
  }
  const events = await drain(
    deps.audit,
    (payloads) => deps.api.sendEvents(payloads),
    deps,
  );
  return bills.sent + returns.sent + events.sent;
}
