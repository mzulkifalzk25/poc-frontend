import { pbkdf2Sync } from "node:crypto";

import { describe, expect, it } from "vitest";

import { verifyPin } from "./pin-verifier";

// Built the same way as the server's make_pin_verifier.
function serverVerifier(pin: string, salt: string, iterations: number) {
  const hash = pbkdf2Sync(pin, salt, iterations, 32, "sha256").toString(
    "base64",
  );
  return `pbkdf2_sha256$${String(iterations)}$${salt}$${hash}`;
}

describe("verifyPin", () => {
  const verifier = serverVerifier("4821", "Xy9-salt_Q", 1000);

  it("accepts the right PIN", async () => {
    await expect(verifyPin("4821", verifier)).resolves.toBe(true);
  });

  it("refuses a wrong PIN", async () => {
    await expect(verifyPin("4812", verifier)).resolves.toBe(false);
  });

  it("refuses a verifier it does not understand", async () => {
    await expect(verifyPin("4821", "argon2$1$s$h")).resolves.toBe(false);
    await expect(verifyPin("4821", "")).resolves.toBe(false);
  });
});
