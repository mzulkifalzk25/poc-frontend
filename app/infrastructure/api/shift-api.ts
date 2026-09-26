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
};
