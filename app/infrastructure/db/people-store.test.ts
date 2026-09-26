import { describe, expect, it } from "vitest";

import { createPeopleStore, type PersonUpdate } from "./people-store";
import { freshDatabaseFactory } from "./test-database";

const freshDatabase = freshDatabaseFactory();

function person(
  id: number,
  fullName: string,
  overrides: Partial<PersonUpdate> = {},
): PersonUpdate {
  return {
    id,
    fullName,
    initials: "XX",
    pinVerifier: `pbkdf2_sha256$1000$salt$${String(id)}`,
    active: true,
    unlockedAt: null,
    ...overrides,
  };
}

describe("people store", () => {
  it("matches a typed name trimmed, collapsed and in any case", async () => {
    const store = createPeopleStore(freshDatabase());
    await store.applyPeople([
      person(12, "Zainab Khan"),
      person(13, "Bilal Raza"),
    ]);

    await expect(store.findByName("  zainab   KHAN ")).resolves.toMatchObject({
      id: 12,
    });
    await expect(store.findByName("Zainab")).resolves.toBeNull();
  });

  it("removes a deactivated cashier so they cannot sign in", async () => {
    const store = createPeopleStore(freshDatabase());
    await store.applyPeople([
      person(12, "Zainab Khan"),
      person(14, "Usman Tariq"),
    ]);
    await store.applyPeople([
      person(14, "Usman Tariq", { active: false, pinVerifier: null }),
    ]);

    await expect(store.findByName("Usman Tariq")).resolves.toBeNull();
    await expect(store.list()).resolves.toHaveLength(1);
  });

  it("updates a renamed cashier and the unlock time", async () => {
    const store = createPeopleStore(freshDatabase());
    await store.applyPeople([person(12, "Zainab Khan")]);
    await store.applyPeople([
      person(12, "Zainab Ali", { unlockedAt: "2026-09-26T10:00:00Z" }),
    ]);

    await expect(store.findByName("zainab ali")).resolves.toMatchObject({
      id: 12,
      unlockedAt: "2026-09-26T10:00:00Z",
    });
    await expect(store.findByName("zainab khan")).resolves.toBeNull();
  });
});
