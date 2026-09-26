// Money is handled in whole paisa (1 rupee = 100 paisa) so sums never drift.
export function toPaisa(amount: string): number {
  const value = Number(amount);
  if (amount.trim() === "" || !Number.isFinite(value)) {
    throw new Error(`Invalid amount: ${amount}`);
  }
  return Math.round(value * 100);
}

export function fromPaisa(paisa: number): string {
  if (!Number.isInteger(paisa)) {
    throw new Error(`Paisa must be whole: ${String(paisa)}`);
  }
  const sign = paisa < 0 ? "-" : "";
  const abs = Math.abs(paisa);
  return `${sign}${String(Math.floor(abs / 100))}.${String(abs % 100).padStart(2, "0")}`;
}

// Half up to whole rupees, symmetric for negatives.
export function roundToRupee(paisa: number): number {
  const sign = paisa < 0 ? -1 : 1;
  return sign * Math.round(Math.abs(paisa) / 100) * 100;
}
