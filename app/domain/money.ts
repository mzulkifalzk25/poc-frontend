export function parseMoney(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid money value: ${value}`);
  }
  return parsed;
}

export function roundToWholeRupees(amount: number): number {
  return Math.round(amount);
}

function withThousandsSeparators(value: number): string {
  const sign = value < 0 ? "-" : "";
  const digits = Math.abs(value).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return sign + grouped;
}

export function formatMoney(value: string | number): string {
  const amount = typeof value === "string" ? parseMoney(value) : value;
  return `Rs ${withThousandsSeparators(roundToWholeRupees(amount))}`;
}

// "1,650" without the currency, for table columns under a money heading.
export function formatAmount(value: string | number): string {
  return formatMoney(value).slice("Rs ".length);
}

export function formatPaisa(paisa: number): string {
  return formatMoney(paisa / 100);
}

// "Rs 40.1M", "Rs 96.4K" or "Rs 850": the short form big report numbers use.
export function formatCompactMoney(value: string | number): string {
  const amount = typeof value === "string" ? parseMoney(value) : value;
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1_000_000) {
    return `${sign}Rs ${trimZero(abs / 1_000_000)}M`;
  }
  if (abs >= 10_000) {
    return `${sign}Rs ${trimZero(abs / 1_000)}K`;
  }
  return formatMoney(amount);
}

function trimZero(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 1 });
}
