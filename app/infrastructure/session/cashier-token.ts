import { getSession } from "./session-store";

// A cashier signed in offline has no JWT yet, so the counter's device token is used (contract v4.1).
export function cashierTokenSource(): "user" | "device" {
  const session = getSession();
  return session?.role === "cashier" && session.accessToken ? "user" : "device";
}
