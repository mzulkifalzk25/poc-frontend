import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useCounterKeys } from "./useCounterKeys";

function press(key: string) {
  const event = new KeyboardEvent("keydown", { key, cancelable: true });
  window.dispatchEvent(event);
  return event;
}

describe("useCounterKeys", () => {
  it("runs the handler for each counter key and stops the browser default", () => {
    const handlers = { F2: vi.fn(), F4: vi.fn(), F9: vi.fn(), Escape: vi.fn() };
    renderHook(() => {
      useCounterKeys(handlers);
    });

    const events = ["F2", "F4", "F9", "Escape"].map(press);

    expect(handlers.F2).toHaveBeenCalledOnce();
    expect(handlers.F4).toHaveBeenCalledOnce();
    expect(handlers.F9).toHaveBeenCalledOnce();
    expect(handlers.Escape).toHaveBeenCalledOnce();
    expect(events.every((event) => event.defaultPrevented)).toBe(true);
  });

  it("leaves other keys and keys without a handler alone", () => {
    const F9 = vi.fn();
    renderHook(() => {
      useCounterKeys({ F9 });
    });

    expect(press("F4").defaultPrevented).toBe(false);
    expect(press("Enter").defaultPrevented).toBe(false);
    expect(F9).not.toHaveBeenCalled();
  });

  it("always uses the latest handlers and stops after unmount", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ handler }) => {
        useCounterKeys({ F9: handler });
      },
      { initialProps: { handler: first } },
    );

    rerender({ handler: second });
    press("F9");
    unmount();
    press("F9");

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });
});
