import type { PinDelayState } from "~/domain/pin-delay";
import { NO_DELAY } from "~/domain/pin-delay";
import type { CashierSignInDeps } from "~/use_cases/sign-in-cashier";

import { cashierAuthRepository } from "../api/cashier-auth-repository";
import { counterClock } from "../clock";
import { verifyPin } from "../crypto/pin-verifier";
import { META_KEYS } from "../db/meta-keys";
import { metaStore } from "../db/meta-store";
import { auditOutbox } from "../db/outbox-store";
import { peopleStore } from "../db/people-store";

type DelayMap = Record<string, PinDelayState>;

async function readDelays(): Promise<DelayMap> {
  return (await metaStore.get<DelayMap>(META_KEYS.pinDelays)) ?? {};
}

export const cashierSignInDeps: CashierSignInDeps = {
  repo: cashierAuthRepository,
  localRoster: {
    findByName: async (typed) => {
      const row = await peopleStore.findByName(typed);
      return (
        row && {
          id: row.id,
          fullName: row.fullName,
          pinVerifier: row.pinVerifier,
          unlockedAt: row.unlockedAt,
        }
      );
    },
    count: async () => (await peopleStore.list()).length,
  },
  verifyPin,
  delays: {
    get: async (userId) => (await readDelays())[String(userId)] ?? NO_DELAY,
    set: async (userId, state) => {
      await metaStore.set(META_KEYS.pinDelays, {
        ...(await readDelays()),
        [String(userId)]: state,
      });
    },
  },
  queueAudit: (event) => auditOutbox.add(event, Date.now()),
  now: () => counterClock.now(),
  newId: () => crypto.randomUUID(),
};
