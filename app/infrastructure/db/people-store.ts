import { normalizeName } from "~/domain/normalize-name";

import { db as appDb, type MartDeskDatabase } from "./database";
import type { UserRow } from "./rows";

export interface PersonUpdate {
  id: number;
  fullName: string;
  initials: string;
  pinVerifier: string | null;
  active: boolean;
  unlockedAt: string | null;
}

export function createPeopleStore(database: MartDeskDatabase) {
  return {
    // A deactivated cashier (or one without a verifier) is removed, so it cannot sign in.
    applyPeople: async (people: PersonUpdate[]) => {
      await database.transaction("rw", database.users, async () => {
        for (const person of people) {
          if (!person.active || !person.pinVerifier) {
            await database.users.delete(person.id);
            continue;
          }
          await database.users.put({
            id: person.id,
            fullName: person.fullName,
            nameKey: normalizeName(person.fullName),
            initials: person.initials,
            pinVerifier: person.pinVerifier,
            unlockedAt: person.unlockedAt,
          });
        }
      });
    },
    findByName: async (typed: string): Promise<UserRow | null> =>
      (await database.users
        .where("nameKey")
        .equals(normalizeName(typed))
        .first()) ?? null,
    get: async (id: number) => (await database.users.get(id)) ?? null,
    list: () => database.users.orderBy("nameKey").toArray(),
  };
}

export type PeopleStore = ReturnType<typeof createPeopleStore>;

export const peopleStore = createPeopleStore(appDb);
