import { parseMoney } from "./money";

export interface UnitProfit {
  profit: number;
  marginPercent: number | null;
}

// Margin is profit as a share of the selling price, to one decimal place.
export function profitPerUnit(price: string, cost: string): UnitProfit {
  const sell = parseMoney(price);
  const profit = Math.round((sell - parseMoney(cost)) * 100) / 100;
  if (sell <= 0) {
    return { profit, marginPercent: null };
  }
  return { profit, marginPercent: Math.round((profit / sell) * 1000) / 10 };
}
