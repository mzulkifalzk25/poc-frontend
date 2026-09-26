const API_BILL_NO_PATTERN = /^\d{9}$/;

export function formatBillNumber(apiBillNo: string): string {
  if (!API_BILL_NO_PATTERN.test(apiBillNo)) {
    throw new Error(`Invalid bill number: ${apiBillNo}`);
  }
  return `${apiBillNo.slice(0, 3)}-${apiBillNo.slice(3)}`;
}

export function toApiBillNumber(displayBillNo: string): string {
  const stripped = displayBillNo.replace(/-/g, "");
  if (!/^\d{9}$/.test(stripped)) {
    throw new Error(`Invalid bill number: ${displayBillNo}`);
  }
  return stripped;
}

const MAX_SEQUENCE = 999_999;

// Counter code (3 digits) + this counter's own sequence (6 digits), e.g. "002000744".
export function nextBillNumber(
  counterCode: string,
  lastSequence: number,
): string {
  if (!/^\d{3}$/.test(counterCode)) {
    throw new Error(`Invalid counter code: ${counterCode}`);
  }
  const next = lastSequence + 1;
  if (
    !Number.isInteger(lastSequence) ||
    lastSequence < 0 ||
    next > MAX_SEQUENCE
  ) {
    throw new Error(`Bill sequence out of range: ${String(lastSequence)}`);
  }
  return `${counterCode}${String(next).padStart(6, "0")}`;
}
