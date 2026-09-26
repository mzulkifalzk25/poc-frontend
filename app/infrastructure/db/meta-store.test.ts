import { describe, expect, it } from "vitest";

import { createMetaStore } from "./meta-store";
import { freshDatabaseFactory } from "./test-database";

const freshDatabase = freshDatabaseFactory();

describe("meta store", () => {
  it("keeps small values by key", async () => {
    const meta = createMetaStore(freshDatabase());

    await expect(meta.get("billSeq")).resolves.toBeNull();
    await meta.set("billSeq", 743);
    await expect(meta.get<number>("billSeq")).resolves.toBe(743);
    await meta.remove("billSeq");
    await expect(meta.get("billSeq")).resolves.toBeNull();
  });
});
