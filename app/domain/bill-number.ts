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
