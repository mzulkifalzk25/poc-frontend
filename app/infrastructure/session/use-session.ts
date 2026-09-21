import { useSyncExternalStore } from "react";

import {
  getSession,
  subscribeSession,
  type AuthSession,
} from "./session-store";

export function useSession(): AuthSession | null {
  return useSyncExternalStore(subscribeSession, getSession, getSession);
}
