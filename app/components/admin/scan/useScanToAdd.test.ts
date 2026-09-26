import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "~/infrastructure/api/errors";
import type { ProductRepository } from "~/use_cases/manage-products";

import { useScanToAdd } from "./useScanToAdd";

function repoWithUnknownBarcodes(): ProductRepository {
  return {
    byBarcode: vi.fn(() =>
      Promise.reject(
        new ApiError(404, {
          error: { code: "unknown_barcode", message: "Unknown" },
        }),
      ),
    ),
  } as unknown as ProductRepository;
}

describe("useScanToAdd", () => {
  it("keeps the typed form when the same barcode is seen again", async () => {
    const repo = repoWithUnknownBarcodes();
    const { result } = renderHook(() =>
      useScanToAdd({ repo, onKnown: vi.fn(), onCreated: vi.fn() }),
    );

    await act(() => result.current.scan("8961011200111"));
    act(() => {
      result.current.update({ name: "Wafer Chocolate 40g" });
    });
    await act(() => result.current.scan("8961011200111"));

    expect(result.current.draft.name).toBe("Wafer Chocolate 40g");
    expect(repo.byBarcode).toHaveBeenCalledTimes(1);
  });

  it("starts a fresh form for a different barcode", async () => {
    const repo = repoWithUnknownBarcodes();
    const { result } = renderHook(() =>
      useScanToAdd({ repo, onKnown: vi.fn(), onCreated: vi.fn() }),
    );

    await act(() => result.current.scan("8961011200111"));
    act(() => {
      result.current.update({ name: "Wafer Chocolate 40g" });
    });
    await act(() => result.current.scan("8961011200128"));

    expect(result.current.draft).toMatchObject({
      barcode: "8961011200128",
      name: "",
    });
  });
});
