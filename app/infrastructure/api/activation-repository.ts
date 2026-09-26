import type { ActivationRepository } from "~/use_cases/activate-counter";

import { APP_VERSION } from "../app-version";
import { apiClient } from "./client";

interface ActivateResponse {
  device_token: string;
  counter: { id: number; name: string; code: string };
}

export const activationRepository: ActivationRepository = {
  activate: async (code) => {
    const response = await apiClient.post<ActivateResponse>(
      "/devices/activate",
      { code, app_version: APP_VERSION },
      { tokenSource: "none" },
    );
    return {
      deviceToken: response.device_token,
      counter: response.counter,
    };
  },
  countCashiers: async () => {
    const roster = await apiClient.get<unknown[]>("/pos/roster", {
      tokenSource: "device",
    });
    return roster.length;
  },
};
