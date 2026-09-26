const BARCODE_PATTERN = /^[A-Za-z0-9-]{4,32}$/;

// Keyboard-wedge scanners may add spaces or control characters around the code.
export function cleanBarcode(raw: string): string {
  return raw.replace(/[\s\p{Cc}]/gu, "");
}

export function isPlausibleBarcode(code: string): boolean {
  return BARCODE_PATTERN.test(code);
}
