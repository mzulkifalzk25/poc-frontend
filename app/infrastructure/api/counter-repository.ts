import type { Counter, CounterStatus } from "~/domain/counter";

import { apiClient } from "./client";

interface CounterDto {
  id: number;
  name: string;
  code: string;
  status: CounterStatus;
  code_expires_at: string | null;
  last_seen_at: string | null;
  next_bill_no: string;
  unsynced_count: number | null;
  has_open_shift: boolean;
  has_bills: boolean;
}

function toCounter(dto: CounterDto): Counter {
  return {
    id: dto.id,
    name: dto.name,
    code: dto.code,
    status: dto.status,
    codeExpiresAt: dto.code_expires_at,
    lastSeenAt: dto.last_seen_at,
    nextBillNo: dto.next_bill_no,
    unsyncedCount: dto.unsynced_count,
    hasOpenShift: dto.has_open_shift,
    hasBills: dto.has_bills,
  };
}

export async function listCounters(): Promise<Counter[]> {
  const rows = await apiClient.get<CounterDto[]>("/counters");
  return rows.map(toCounter);
}
