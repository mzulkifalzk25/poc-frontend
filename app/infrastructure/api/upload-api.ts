import type { BatchResult, UploadApi } from "~/use_cases/upload-outbox";

import { cashierTokenSource } from "../session/cashier-token";
import { apiClient } from "./client";

interface BatchResponse {
  results: { id: string; status: BatchResult["status"]; errors?: string[] }[];
}

function toResults(response: BatchResponse): BatchResult[] {
  return response.results.map((result) => ({
    id: result.id,
    status: result.status,
    errors: result.errors ?? [],
  }));
}

export const uploadApi: UploadApi = {
  sendBills: async (counterId, bills) =>
    toResults(
      await apiClient.post<BatchResponse>(
        "/bills/batch",
        { counter_id: counterId, bills },
        { tokenSource: cashierTokenSource() },
      ),
    ),
  sendReturns: async (returns) =>
    toResults(
      await apiClient.post<BatchResponse>(
        "/returns/batch",
        { returns },
        { tokenSource: cashierTokenSource() },
      ),
    ),
  sendEvents: async (events) =>
    toResults(
      await apiClient.post<BatchResponse>(
        "/audit/events/batch",
        { events },
        { tokenSource: cashierTokenSource() },
      ),
    ),
};
