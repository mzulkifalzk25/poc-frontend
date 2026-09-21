const DEVICE_TOKEN_KEY = "martdesk.device_token";
const DEVICE_COUNTER_KEY = "martdesk.device_counter";

export interface DeviceCounter {
  name: string;
  code: string;
}

// Interim localStorage flags; replaced by the Dexie device-meta store
// once the activate-counter branch lands.
export function getDeviceToken(): string | null {
  return localStorage.getItem(DEVICE_TOKEN_KEY);
}

export function setDeviceToken(token: string | null): void {
  if (token) {
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(DEVICE_TOKEN_KEY);
  }
}

export function hasActivatedDevice(): Promise<boolean> {
  return Promise.resolve(getDeviceToken() !== null);
}

export function getDeviceCounter(): DeviceCounter | null {
  const raw = localStorage.getItem(DEVICE_COUNTER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as DeviceCounter;
  } catch {
    return null;
  }
}

export function setDeviceCounter(counter: DeviceCounter | null): void {
  if (counter) {
    localStorage.setItem(DEVICE_COUNTER_KEY, JSON.stringify(counter));
  } else {
    localStorage.removeItem(DEVICE_COUNTER_KEY);
  }
}
