import { describe, expect, it, vi } from "vitest";

import type { Counter } from "~/domain/counter";
import { ApiError } from "~/infrastructure/api/errors";

import {
  createCounter,
  deactivateCounter,
  generateActivationCode,
  type CounterRepository,
} from "./manage-counters";

const counter4 = { id: 4, name: "Counter 4", code: "004" } as Counter;

function fakeRepo(): CounterRepository {
  return {
    list: vi.fn(() => Promise.resolve([counter4])),
    create: vi.fn(() => Promise.resolve(counter4)),
    generateCode: vi.fn(() =>
      Promise.resolve({
        counterId: 4,
        code: "K7M4-Q92R",
        expiresAt: "2026-09-19T12:15:00Z",
      }),
    ),
    revokeCode: vi.fn(() => Promise.resolve()),
    deactivate: vi.fn(() => Promise.resolve()),
  };
}

describe("manage counters", () => {
  it("creates a counter with a cleaned name", async () => {
    const repo = fakeRepo();

    await createCounter(repo, { name: "  Counter   4 ", code: "004" });

    expect(repo.create).toHaveBeenCalledWith({
      name: "Counter 4",
      code: "004",
    });
  });

  it("returns the new activation code", async () => {
    const outcome = await generateActivationCode(fakeRepo(), 4);

    expect(outcome).toEqual({
      status: "done",
      value: {
        counterId: 4,
        code: "K7M4-Q92R",
        expiresAt: "2026-09-19T12:15:00Z",
      },
    });
  });

  it("reports an open shift as a conflict when deactivating", async () => {
    const repo = fakeRepo();
    const message =
      "This counter has an open shift. Close it before deactivating.";
    vi.mocked(repo.deactivate).mockRejectedValue(
      new ApiError(409, { error: { code: "shift_open", message } }),
    );

    expect(await deactivateCounter(repo, 2)).toEqual({
      status: "conflict",
      code: "shift_open",
      message,
    });
  });
});
