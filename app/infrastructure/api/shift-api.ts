import type { ShiftUploadApi } from "~/use_cases/upload-shifts";

import { cashierTokenSource } from "../session/cashier-token";
import { apiClient } from "./client";
import { isApiError } from "./errors";

export const shiftApi: ShiftUploadApi = {
  open: async (shift) => {
    try {
      await apiClient.post(
        "/shifts/open",
        {
          id: shift.id,
          counter_id: shift.counterId,
          opened_at: shift.openedAt,
          opening_cash: shift.openingCash,
          cashier_id: shift.cashierId,
        },
        { tokenSource: cashierTokenSource() },
      );
    } catch (error) {
      // The server already has an open shift for this counter; it accepts and flags later bills.
      if (!(isApiError(error) && error.code === "shift_already_open")) {
        throw error;
      }
    }
  },
  close: async (shift) => {
    const answer = await apiClient.post<{
      expected_cash: string;
      difference: string;
      mismatch: boolean;
    }>(
      `/shifts/${shift.id}/close`,
      {
        closed_at: shift.closedAt,
        counted_cash: shift.countedCash,
        local_summary: shift.closeSummary ?? {},
        unsynced_count: shift.unsyncedAtClose ?? 0,
        cashier_id: shift.cashierId,
      },
      { tokenSource: cashierTokenSource() },
    );
    return {
      expectedCash: answer.expected_cash,
      difference: answer.difference,
      mismatch: answer.mismatch,
    };
  },
};
