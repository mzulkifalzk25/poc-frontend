import type { Counter, CounterStatus } from "~/domain/counter";
import type { CounterRepository } from "~/use_cases/manage-counters";

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

export const counterRepository: CounterRepository = {
  list: async () =>
    (await apiClient.get<CounterDto[]>("/counters")).map(toCounter),
  create: async (draft) =>
    toCounter(await apiClient.post<CounterDto>("/counters", draft)),
  generateCode: async (counterId) => {
    const issued = await apiClient.post<{ code: string; expires_at: string }>(
      "/devices/codes",
      { counter_id: counterId },
    );
    return { counterId, code: issued.code, expiresAt: issued.expires_at };
  },
  revokeCode: async (counterId) => {
    await apiClient.delete(`/devices/codes/${String(counterId)}`);
  },
  deactivate: async (counterId) => {
    await apiClient.post(`/counters/${String(counterId)}/deactivate`);
  },
};
