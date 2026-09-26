import { useRef, useState } from "react";

import { t } from "~/i18n/t";

import { monoFieldClass } from "../FormField";

interface UsbScannerProps {
  disabled: boolean;
  onScan: (code: string) => void;
}

// A keyboard-wedge scanner types the code and presses Enter.
export function UsbScanner({ disabled, onScan }: UsbScannerProps) {
  const strings = t().scanAdd.usb;
  const [code, setCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      className="flex flex-col gap-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        onScan(code);
        setCode("");
        inputRef.current?.focus();
      }}
    >
      <label htmlFor="scan-usb" className="text-[13px] font-semibold">
        {strings.label}
      </label>
      <input
        id="scan-usb"
        ref={inputRef}
        className={`${monoFieldClass} font-semibold`}
        value={code}
        placeholder={strings.placeholder}
        autoComplete="off"
        autoFocus
        disabled={disabled}
        onChange={(event) => {
          setCode(event.target.value);
        }}
      />
      <p className="text-xs text-text-secondary">{strings.hint}</p>
    </form>
  );
}
