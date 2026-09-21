import type { OwnerAuthRepository } from "~/use_cases/sign-in-owner";

import { apiClient } from "./client";

interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    full_name: string;
    role: "owner" | "manager";
  };
}

export const ownerAuthRepository: OwnerAuthRepository = {
  login: async (login, password) => {
    const response = await apiClient.post<LoginResponse>(
      "/auth/login",
      { login, password },
      { tokenSource: "none" },
    );
    return {
      access: response.access,
      refresh: response.refresh,
      userId: response.user.id,
      fullName: response.user.full_name,
      role: response.user.role,
    };
  },
};
