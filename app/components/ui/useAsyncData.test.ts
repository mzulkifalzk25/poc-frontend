import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAsyncData } from "./useAsyncData";

describe("useAsyncData", () => {
  it("starts loading and then holds the data", async () => {
    const load = () => Promise.resolve(["Grocery"]);
    const { result } = renderHook(() => useAsyncData(load));

    expect(result.current.state).toEqual({ status: "loading" });
    await waitFor(() => {
      expect(result.current.state).toEqual({
        status: "ready",
        data: ["Grocery"],
      });
    });
  });

  it("reports an error and loads again on reload", async () => {
    const load = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce("ok");
    const { result } = renderHook(() => useAsyncData(load));

    await waitFor(() => {
      expect(result.current.state.status).toBe("error");
    });
    act(() => {
      result.current.reload();
    });

    expect(result.current.state).toEqual({ status: "loading" });
    await waitFor(() => {
      expect(result.current.state).toEqual({ status: "ready", data: "ok" });
    });
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("ignores an older answer when the loader changes", async () => {
    let resolveFirst: (value: string) => void = () => undefined;
    const first = () =>
      new Promise<string>((resolve) => {
        resolveFirst = resolve;
      });
    const second = () => Promise.resolve("page 2");
    const { result, rerender } = renderHook(({ load }) => useAsyncData(load), {
      initialProps: { load: first },
    });

    rerender({ load: second });
    await waitFor(() => {
      expect(result.current.state).toEqual({ status: "ready", data: "page 2" });
    });
    act(() => {
      resolveFirst("page 1");
    });

    expect(result.current.state).toEqual({ status: "ready", data: "page 2" });
  });
});
