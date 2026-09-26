import { afterEach, describe, expect, it, vi } from "vitest";

import {
  canScanWithCamera,
  startBarcodeCamera,
  type CameraDeps,
} from "./barcode-camera";

function fakeDeps(codes: string[][]) {
  const stop = vi.fn();
  const stream = { getTracks: () => [{ stop }] } as unknown as MediaStream;
  let clock = 0;
  const deps: CameraDeps = {
    Detector: class {
      detect() {
        return Promise.resolve(
          (codes.shift() ?? []).map((rawValue) => ({ rawValue })),
        );
      }
    },
    getUserMedia: vi.fn(() => Promise.resolve(stream)),
    now: () => (clock += 250),
  };
  return { deps, stop };
}

function fakeVideo() {
  const video = document.createElement("video");
  video.play = vi.fn(() => Promise.resolve());
  return video;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("barcode camera", () => {
  it("needs both the detector and camera access", () => {
    const { deps } = fakeDeps([]);

    expect(canScanWithCamera(deps)).toBe(true);
    expect(canScanWithCamera({ ...deps, Detector: null })).toBe(false);
    expect(canScanWithCamera({ ...deps, getUserMedia: null })).toBe(false);
  });

  it("asks for the rear camera and reports each code once", async () => {
    vi.useFakeTimers();
    const { deps, stop } = fakeDeps([
      ["8961011200111"],
      ["8961011200111"],
      [],
      ["8961002300022"],
    ]);
    const onCode = vi.fn();

    const stopCamera = await startBarcodeCamera(fakeVideo(), onCode, deps);
    await vi.advanceTimersByTimeAsync(1000);
    stopCamera();

    expect(deps.getUserMedia).toHaveBeenCalledWith({
      video: { facingMode: "environment" },
    });
    expect(onCode.mock.calls).toEqual([["8961011200111"], ["8961002300022"]]);
    expect(stop).toHaveBeenCalled();
  });

  it("refuses to start without support", async () => {
    const { deps } = fakeDeps([]);

    await expect(
      startBarcodeCamera(fakeVideo(), vi.fn(), { ...deps, Detector: null }),
    ).rejects.toThrow();
  });
});
