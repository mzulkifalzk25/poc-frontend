import type { CashierAuthRepository } from "~/use_cases/sign-in-cashier";

import { apiClient } from "./client";

interface RosterResponseEntry {
  id: number;
  full_name: string;
  initials: string;
}

interface PinLoginResponse {
  access: string;
  refresh: string;
  user: {
    full_name: string;
  };
}

export const cashierAuthRepository: CashierAuthRepository = {
  fetchRoster: async () => {
    const response = await apiClient.get<RosterResponseEntry[]>("/pos/roster", {
      tokenSource: "device",
    });
    return response.map((entry) => ({
      id: entry.id,
      fullName: entry.full_name,
    }));
  },
  pinLogin: async (userId, pin) => {
    const response = await apiClient.post<PinLoginResponse>(
      "/auth/pin-login",
      { user_id: userId, pin },
      { tokenSource: "device" },
    );
    return {
      access: response.access,
      refresh: response.refresh,
      fullName: response.user.full_name,
    };
  },
};
