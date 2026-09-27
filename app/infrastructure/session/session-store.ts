export type Role = "owner" | "manager" | "cashier";

export interface AuthSession {
  role: Role;
  accessToken: string;
  refreshToken: string;
  userId: number;
  fullName: string;
}

const STORAGE_KEY = "martdesk.session";

type Listener = () => void;
const listeners = new Set<Listener>();

// Cached by raw string so getSession() returns a referentially stable
// value when storage hasn't changed, as useSyncExternalStore requires.
let cachedRaw: string | null = null;
let cachedValue: AuthSession | null = null;

function readFromStorage(): AuthSession | null {
  const raw =
    localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) {
    return cachedValue;
  }
  cachedRaw = raw;
  try {
    cachedValue = raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    cachedValue = null;
  }
  return cachedValue;
}

function persist(next: AuthSession | null, remember: boolean): void {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  if (next) {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
}

export function getSession(): AuthSession | null {
  return readFromStorage();
}

export function setSession(next: AuthSession | null, remember = false): void {
  persist(next, remember);
  listeners.forEach((listener) => {
    listener();
  });
}

// Replaces the tokens of the current session, keeping where it is stored.
export function updateSession(changes: Partial<AuthSession>): void {
  const current = readFromStorage();
  if (!current) {
    return;
  }
  const remembered = localStorage.getItem(STORAGE_KEY) !== null;
  setSession({ ...current, ...changes }, remembered);
}

export function subscribeSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
