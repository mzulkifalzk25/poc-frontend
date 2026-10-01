import type {
  ActivityPage,
  ActivityQuery,
  ActivityRow,
} from "~/domain/activity";

import { apiClient } from "./client";

export const ACTIVITY_PAGE_SIZE = 25;

interface RowDto {
  id: number;
  occurred_at: string;
  user: string | null;
  action: string;
  detail: string;
  flag: "info" | "review";
}

interface PageDto {
  header: {
    held_bills_deleted_today: number;
    refunds_today: number;
    price_changes_today: number;
  };
  results: RowDto[];
  next_cursor: string | null;
}

function filterParams(query: ActivityQuery): URLSearchParams {
  const params = new URLSearchParams({ type: query.type });
  if (query.from !== "") {
    params.set("from", query.from);
  }
  if (query.to !== "") {
    params.set("to", query.to);
  }
  return params;
}

function toRow(dto: RowDto): ActivityRow {
  return {
    id: dto.id,
    occurredAt: dto.occurred_at,
    user: dto.user,
    action: dto.action,
    detail: dto.detail,
    flag: dto.flag,
  };
}

export interface ActivityRepository {
  list: (query: ActivityQuery, cursor: string | null) => Promise<ActivityPage>;
  exportCsv: (query: ActivityQuery) => Promise<Blob>;
}

export const activityRepository: ActivityRepository = {
  list: async (query, cursor) => {
    const params = filterParams(query);
    params.set("limit", String(ACTIVITY_PAGE_SIZE));
    if (cursor) {
      params.set("cursor", cursor);
    }
    const dto = await apiClient.get<PageDto>(
      `/activity-log?${params.toString()}`,
    );
    return {
      rows: dto.results.map(toRow),
      nextCursor: dto.next_cursor,
      header: {
        heldBillsDeletedToday: dto.header.held_bills_deleted_today,
        refundsToday: dto.header.refunds_today,
        priceChangesToday: dto.header.price_changes_today,
      },
    };
  },
  exportCsv: (query) =>
    apiClient.get<Blob>(
      `/activity-log/export?${filterParams(query).toString()}`,
      {
        as: "blob",
      },
    ),
};
