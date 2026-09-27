import type { CashierDraft, StaffMember, StaffRole } from "~/domain/staff";
import type { StaffRepository } from "~/use_cases/manage-staff";

import { apiClient } from "./client";

// The POC has a handful of staff; one page of the largest size holds them all.
const STAFF_PAGE_SIZE = 100;

interface StaffDto {
  id: number;
  full_name: string;
  initials: string;
  role: StaffRole;
  default_counter_id: number | null;
  is_active: boolean;
  last_active_at: string | null;
  pin_delay_until: string | null;
}

function toMember(dto: StaffDto): StaffMember {
  return {
    id: dto.id,
    fullName: dto.full_name,
    initials: dto.initials,
    role: dto.role,
    defaultCounterId: dto.default_counter_id,
    isActive: dto.is_active,
    lastActiveAt: dto.last_active_at,
    pinDelayUntil: dto.pin_delay_until,
  };
}

function toCreateBody(draft: CashierDraft) {
  return {
    full_name: draft.fullName,
    role: "cashier",
    pin: draft.pin,
    default_counter_id: draft.defaultCounterId,
  };
}

export const staffRepository: StaffRepository = {
  list: async () => {
    const page = await apiClient.get<{ results: StaffDto[] }>(
      `/users?page_size=${String(STAFF_PAGE_SIZE)}`,
    );
    return page.results.map(toMember);
  },
  createCashier: async (draft) =>
    toMember(await apiClient.post<StaffDto>("/users", toCreateBody(draft))),
  update: async (id, changes) =>
    toMember(
      await apiClient.patch<StaffDto>(`/users/${String(id)}`, {
        full_name: changes.fullName,
        default_counter_id: changes.defaultCounterId,
        is_active: changes.isActive,
      }),
    ),
  resetPin: async (id) =>
    (await apiClient.post<{ pin: string }>(`/users/${String(id)}/reset-pin`))
      .pin,
  unlock: async (id) => {
    await apiClient.post(`/users/${String(id)}/unlock`);
  },
};
