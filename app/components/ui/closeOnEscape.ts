import type { KeyboardEvent } from "react";

export function closeOnEscape(onClose: () => void) {
  return (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
    }
  };
}
