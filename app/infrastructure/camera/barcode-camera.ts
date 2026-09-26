import { isRepeatScan, type LastScan } from "~/domain/barcode";

interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorLike {
  detect: (source: HTMLVideoElement) => Promise<DetectedBarcode[]>;
}

export type BarcodeDetectorConstructor = new () => BarcodeDetectorLike;

export interface CameraDeps {
  Detector: BarcodeDetectorConstructor | null;
  getUserMedia:
    ((constraints: MediaStreamConstraints) => Promise<MediaStream>) | null;
  now: () => number;
}

const SCAN_INTERVAL_MS = 250;
const REPEAT_WINDOW_MS = 3000;

export function browserCameraDeps(): CameraDeps {
  const scope = globalThis as { BarcodeDetector?: BarcodeDetectorConstructor };
  const media =
    typeof navigator === "undefined" ? undefined : navigator.mediaDevices;
  return {
    Detector: scope.BarcodeDetector ?? null,
    getUserMedia: media
      ? (constraints) => media.getUserMedia(constraints)
      : null,
    now: () => Date.now(),
  };
}

export function canScanWithCamera(deps: CameraDeps): boolean {
  return deps.Detector !== null && deps.getUserMedia !== null;
}

// Starts the rear camera and reports each new code; returns a stop function.
export async function startBarcodeCamera(
  video: HTMLVideoElement,
  onCode: (code: string) => void,
  deps: CameraDeps,
): Promise<() => void> {
  if (!deps.Detector || !deps.getUserMedia) {
    throw new Error("Barcode scanning with the camera is not supported");
  }
  const stream = await deps.getUserMedia({
    video: { facingMode: "environment" },
  });
  video.srcObject = stream;
  await video.play();
  const detector = new deps.Detector();
  let last: LastScan | null = null;
  const timer = setInterval(() => {
    void detector.detect(video).then((codes) => {
      const code = codes[0]?.rawValue;
      const at = deps.now();
      if (code && !isRepeatScan(last, code, at, REPEAT_WINDOW_MS)) {
        last = { code, at };
        onCode(code);
      }
    });
  }, SCAN_INTERVAL_MS);
  return () => {
    clearInterval(timer);
    stream.getTracks().forEach((track) => {
      track.stop();
    });
    video.srcObject = null;
  };
}
