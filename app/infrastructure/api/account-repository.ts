import { apiClient } from "./client";

export interface AccountRepository {
  changePassword: (current: string, next: string) => Promise<void>;
}

export const accountRepository: AccountRepository = {
  changePassword: async (current, next) => {
    await apiClient.post("/me/change-password", {
      current_password: current,
      new_password: next,
    });
  },
};
