import { apiClient, type TokenProvider } from "../api/client";
import { getSession, updateSession } from "./session-store";

interface RefreshResponse {
  access: string;
  refresh: string;
}

async function refreshSession(): Promise<boolean> {
  const session = getSession();
  if (!session?.refreshToken) {
    return false;
  }
  try {
    const tokens = await apiClient.post<RefreshResponse>(
      "/auth/refresh",
      { refresh: session.refreshToken },
      { tokenSource: "none" },
    );
    updateSession({ accessToken: tokens.access, refreshToken: tokens.refresh });
    return true;
  } catch {
    return false;
  }
}

// Gives the API client the signed-in user's token; parallel 401s share one refresh.
export function createSessionTokenProvider(): TokenProvider {
  let refreshing: Promise<boolean> | null = null;
  return {
    getAccessToken: () => getSession()?.accessToken || null,
    refresh: () => {
      refreshing ??= refreshSession().finally(() => {
        refreshing = null;
      });
      return refreshing;
    },
  };
}

export const sessionTokenProvider = createSessionTokenProvider();
