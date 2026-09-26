import { useState } from "react";

interface QuantityInputProps {
  label: string;
  qty: number;
  onCommit: (qty: number) => void;
}

// Edited as text and applied on Enter or blur, so clearing the box to retype never removes the row.
export function QuantityInput({ label, qty, onCommit }: QuantityInputProps) {
  const [draft, setDraft] = useState<string | null>(null);

  function commit() {
    if (draft !== null && draft.trim() !== "") {
      onCommit(Number(draft));
    }
    setDraft(null);
  }

  return (
    <input
      aria-label={label}
      inputMode="numeric"
      value={draft ?? String(qty)}
      className="h-11 w-16 rounded-input border-[1.5px] border-border-strong bg-white text-center font-mono text-xl font-semibold text-text outline-none focus:border-blue focus:ring-2 focus:ring-blue"
      onChange={(event) => {
        setDraft(event.target.value.replace(/[^0-9]/g, ""));
      }}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
        }
      }}
    />
  );
}
