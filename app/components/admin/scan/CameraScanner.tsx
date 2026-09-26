import { useEffect, useEffectEvent, useRef, useState } from "react";

import { t } from "~/i18n/t";
import {
  browserCameraDeps,
  canScanWithCamera,
  startBarcodeCamera,
} from "~/infrastructure/camera/barcode-camera";

type CameraState = "starting" | "live" | "blocked" | "unsupported";

interface CameraScannerProps {
  detected: string | null;
  onScan: (code: string) => void;
}

function useBarcodeCamera(onScan: (code: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [deps] = useState(browserCameraDeps);
  const supported = canScanWithCamera(deps);
  const [state, setState] = useState<CameraState>(
    supported ? "starting" : "unsupported",
  );
  const report = useEffectEvent((code: string) => {
    onScan(code);
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!supported || !video) {
      return;
    }
    let stop: (() => void) | null = null;
    let cancelled = false;
    startBarcodeCamera(video, report, deps).then(
      (stopCamera) => {
        if (cancelled) {
          stopCamera();
          return;
        }
        stop = stopCamera;
        setState("live");
      },
      () => {
        setState("blocked");
      },
    );
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [supported, deps]);

  return { videoRef, state };
}

function Corners() {
  const corner = "absolute h-7 w-7 border-gold";
  return (
    <div aria-hidden="true" className="absolute inset-x-[70px] inset-y-10">
      <span
        className={`${corner} start-0 top-0 rounded-ss-md border-s-4 border-t-4`}
      />
      <span
        className={`${corner} end-0 top-0 rounded-se-md border-e-4 border-t-4`}
      />
      <span
        className={`${corner} start-0 bottom-0 rounded-es-md border-s-4 border-b-4`}
      />
      <span
        className={`${corner} end-0 bottom-0 rounded-ee-md border-e-4 border-b-4`}
      />
      <span className="absolute inset-x-2.5 top-1/2 h-0.5 bg-[#FF5A4F]" />
    </div>
  );
}

export function CameraScanner({ detected, onScan }: CameraScannerProps) {
  const strings = t().scanAdd;
  const { videoRef, state } = useBarcodeCamera(onScan);
  const message = state === "live" ? null : strings.camera[state];

  return (
    <div
      aria-label={strings.camera.label}
      role="region"
      className="relative flex h-[190px] items-center justify-center overflow-hidden rounded-card bg-navy text-white"
    >
      <video
        ref={videoRef}
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
      {state === "live" && <Corners />}
      {message && (
        <p
          role="status"
          className="relative max-w-[340px] px-4 text-center text-sm"
        >
          {message}
        </p>
      )}
      <span className="absolute start-3 top-3 rounded-pill bg-white/15 px-2.5 py-[5px] text-xs font-semibold">
        {strings.camera.rear}
      </span>
      {detected && (
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-input bg-blue px-3 py-2">
          <span className="text-xs font-semibold">{strings.detected}</span>
          <span className="font-mono text-sm font-semibold">{detected}</span>
        </div>
      )}
    </div>
  );
}
