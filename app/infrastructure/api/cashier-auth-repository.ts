import type { CashierAuthRepository } from "~/use_cases/sign-in-cashier";

import { apiClient } from "./client";

interface CashierLoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    full_name: string;
  };
}

export const cashierAuthRepository: CashierAuthRepository = {
  login: async (login, password) => {
    const response = await apiClient.post<CashierLoginResponse>(
      "/auth/cashier-login",
      { login, password },
      { tokenSource: "device" },
    );
    return {
      access: response.access,
      refresh: response.refresh,
      userId: response.user.id,
      fullName: response.user.full_name,
    };
  },
};
