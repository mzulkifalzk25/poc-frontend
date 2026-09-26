import { describe, expect, it } from "vitest";

import { createCounterClock } from "./clock";
import { createMetaStore } from "./db/meta-store";
import { freshDatabaseFactory } from "./db/test-database";

const freshDatabase = freshDatabaseFactory();
const local = Date.parse("2026-09-26T10:00:00Z");

describe("counter clock", () => {
  it("uses local time until an offset is known", () => {
    const clock = createCounterClock(
      createMetaStore(freshDatabase()),
      () => local,
    );

    expect(clock.now().toISOString()).toBe("2026-09-26T10:00:00.000Z");
  });

  it("keeps the offset across restarts", async () => {
    const meta = createMetaStore(freshDatabase());
    await createCounterClock(meta, () => local).record(-60_000);

    const restarted = createCounterClock(meta, () => local);
    await restarted.load();

    expect(restarted.now().toISOString()).toBe("2026-09-26T09:59:00.000Z");
    expect(restarted.offset()).toBe(-60_000);
  });
});
