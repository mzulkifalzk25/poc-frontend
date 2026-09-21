import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getSession,
  setSession,
  subscribeSession,
  type AuthSession,
} from "./session-store";

const cashierSession: AuthSession = {
  role: "cashier",
  accessToken: "access-1",
  refreshToken: "refresh-1",
  userId: 12,
  fullName: "Zainab Khan",
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("session-store", () => {
  it("has no session by default", () => {
    expect(getSession()).toBeNull();
  });

  it("persists to sessionStorage by default", () => {
    setSession(cashierSession);

    expect(getSession()).toEqual(cashierSession);
    expect(sessionStorage.getItem("martdesk.session")).not.toBeNull();
    expect(localStorage.getItem("martdesk.session")).toBeNull();
  });

  it("persists to localStorage when remembered", () => {
    setSession(cashierSession, true);

    expect(localStorage.getItem("martdesk.session")).not.toBeNull();
    expect(sessionStorage.getItem("martdesk.session")).toBeNull();
  });

  it("clears the session", () => {
    setSession(cashierSession, true);
    setSession(null);

    expect(getSession()).toBeNull();
    expect(localStorage.getItem("martdesk.session")).toBeNull();
  });

  it("notifies subscribers on change", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSession(listener);

    setSession(cashierSession);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    setSession(null);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
