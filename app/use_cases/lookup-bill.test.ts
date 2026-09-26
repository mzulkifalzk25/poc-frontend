import { describe, expect, it, vi } from "vitest";

import { ApiError } from "~/infrastructure/api/errors";
import { completedBill } from "~/infrastructure/db/test-database";

import {
  lookupBill,
  normalizeBillNo,
  type LookupBillDeps,
} from "./lookup-bill";

function deps(overrides: Partial<LookupBillDeps> = {}): LookupBillDeps {
  return {
    findLocal: vi.fn((billNo: string) =>
      Promise.resolve(billNo === "002000743" ? completedBill("b1") : null),
    ),
    fetchRemote: vi.fn(() =>
      Promise.resolve([
        { productId: 2, unitPrice: "600.00", returnableQty: 1 },
      ]),
    ),
    ...overrides,
  };
}

describe("normalizeBillNo", () => {
  it("accepts the screen and API forms", () => {
    expect(normalizeBillNo("002-000743")).toBe("002000743");
    expect(normalizeBillNo(" 002000743 ")).toBe("002000743");
    expect(normalizeBillNo("2-743")).toBeNull();
  });
});

describe("lookupBill", () => {
  it("finds this counter's bill on the PC without the network", async () => {
    const lookup = deps();

    const result = await lookupBill(lookup, "002-000743");

    expect(result).toMatchObject({
      status: "found",
      source: "this_counter",
      bill: { billNo: "002000743" },
    });
    if (result.status === "found") {
      expect(result.bill.prices.get(4)).toEqual({
        unitPrice: "290.00",
        returnableQty: null,
      });
    }
    expect(lookup.fetchRemote).not.toHaveBeenCalled();
  });

  it("asks the server for another counter's bill", async () => {
    const result = await lookupBill(deps(), "001-000498");

    expect(result).toMatchObject({ status: "found", source: "server" });
    if (result.status === "found") {
      expect(result.bill.prices.get(2)).toEqual({
        unitPrice: "600.00",
        returnableQty: 1,
      });
    }
  });

  it("says a bill was not found without blocking", async () => {
    const lookup = deps({
      fetchRemote: () =>
        Promise.reject(
          new ApiError(404, {
            error: { code: "bill_not_found", message: "No bill" },
          }),
        ),
    });

    await expect(lookupBill(lookup, "001000498")).resolves.toEqual({
      status: "not_found",
      billNo: "001000498",
    });
  });

  it("falls back when offline or when the cashier has no token for the lookup", async () => {
    await expect(
      lookupBill(
        deps({
          fetchRemote: () => Promise.reject(new TypeError("Failed to fetch")),
        }),
        "001000498",
      ),
    ).resolves.toEqual({ status: "unavailable", billNo: "001000498" });
    await expect(
      lookupBill(deps({ fetchRemote: null }), "001000498"),
    ).resolves.toEqual({
      status: "unavailable",
      billNo: "001000498",
    });
  });

  it("ignores an empty field and rejects a malformed number", async () => {
    await expect(lookupBill(deps(), "  ")).resolves.toEqual({
      status: "empty",
    });
    await expect(lookupBill(deps(), "12-34")).resolves.toEqual({
      status: "invalid",
    });
  });
});
