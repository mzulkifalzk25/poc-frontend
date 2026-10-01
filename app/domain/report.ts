export interface DayPoint {
  date: string;
  sales: string;
}

export interface DashboardData {
  date: string;
  sales: string;
  bills: number;
  items: string;
  refunds: { count: number; amount: string };
  salesChange: string | null;
  billsChange: string | null;
  itemsChange: string | null;
  lowStockCount: number;
  series7: DayPoint[];
  series30: DayPoint[];
  categories: { name: string; tint: string; revenue: string; share: string }[];
  topProducts: {
    productId: number;
    name: string;
    units: string;
    revenue: string;
  }[];
  lowStock: { productId: number; name: string; stock: string }[];
}

export interface SummaryPeriod {
  period: string;
  end: string;
  revenue: string;
  grossProfit: string;
  bills: number;
}

export interface SummaryData {
  revenue: string;
  grossProfit: string;
  bills: number;
  averageBill: string;
  refundCount: number;
  periods: SummaryPeriod[];
}

export interface CategoryRow {
  name: string;
  tint: string;
  revenue: string;
  profit: string;
  margin: string;
}

export interface CashierRow {
  cashierId: number;
  name: string;
  isActive: boolean;
  bills: number;
  revenue: string;
}

export interface CashiersData {
  totalCashiers: number;
  refundCount: number;
  rows: CashierRow[];
}

export interface MoneyPeriod {
  period: string;
  salesTotal: string;
  salesCash: string;
  salesCard: string;
  salesWallet: string;
  refundsTotal: string;
  refundsCount: number;
  stockBought: string;
  net: string;
  grossProfit: string;
}

export interface MoneyData {
  group: "day" | "month";
  periods: MoneyPeriod[];
  totals: MoneyPeriod & {
    deliveries: number;
    profitMargin: string;
    refundRate: string;
  };
}

export interface RefundByCashier {
  cashierId: number;
  name: string;
  isActive: boolean;
  refundsCount: number;
  refundsAmount: string;
}

export type PaymentShare = {
  method: "cash" | "card" | "wallet";
  amount: number;
  share: number;
};

// Cash, card and wallet as a share of all sales (0 to 100, one decimal).
export function paymentShares(totals: MoneyPeriod): PaymentShare[] {
  const amounts = {
    cash: Number(totals.salesCash),
    card: Number(totals.salesCard),
    wallet: Number(totals.salesWallet),
  };
  const sum = amounts.cash + amounts.card + amounts.wallet;
  return (["cash", "card", "wallet"] as const).map((method) => ({
    method,
    amount: amounts[method],
    share: sum > 0 ? Math.round((amounts[method] / sum) * 1000) / 10 : 0,
  }));
}

// "+6.2%", "-3.0%" or null when there is no earlier figure to compare with.
export function formatChange(change: string | null): string | null {
  if (change === null) {
    return null;
  }
  const value = Number(change);
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}
