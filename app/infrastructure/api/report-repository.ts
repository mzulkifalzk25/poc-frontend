import type { DateRange } from "~/domain/date-range";
import type {
  CashiersData,
  CategoryRow,
  DashboardData,
  MoneyData,
  MoneyPeriod,
  RefundByCashier,
  SummaryData,
} from "~/domain/report";

import { apiClient } from "./client";

interface MoneyPeriodDto {
  period: string;
  sales_total: string;
  sales_cash: string;
  sales_card: string;
  sales_wallet: string;
  refunds_total: string;
  refunds_count: number;
  stock_bought: string;
  net: string;
  gross_profit: string;
}

function toMoneyPeriod(dto: MoneyPeriodDto): MoneyPeriod {
  return {
    period: dto.period,
    salesTotal: dto.sales_total,
    salesCash: dto.sales_cash,
    salesCard: dto.sales_card,
    salesWallet: dto.sales_wallet,
    refundsTotal: dto.refunds_total,
    refundsCount: dto.refunds_count,
    stockBought: dto.stock_bought,
    net: dto.net,
    grossProfit: dto.gross_profit,
  };
}

function rangeQuery(
  range: DateRange,
  extra: Record<string, string> = {},
): string {
  return new URLSearchParams({
    from: range.from,
    to: range.to,
    ...extra,
  }).toString();
}

export type ExportReport = "money" | "refunds_by_cashier" | "summary";

export interface ReportRepository {
  dashboard: () => Promise<DashboardData>;
  summary: (
    range: DateRange,
    group: "hour" | "day" | "week",
  ) => Promise<SummaryData>;
  categories: (range: DateRange) => Promise<CategoryRow[]>;
  cashiers: (range: DateRange, limit: number) => Promise<CashiersData>;
  money: (range: DateRange, group: "day" | "month") => Promise<MoneyData>;
  refundsByCashier: (range: DateRange) => Promise<RefundByCashier[]>;
  exportCsv: (
    report: ExportReport,
    range: DateRange,
    group?: string,
  ) => Promise<Blob>;
}

export const reportRepository: ReportRepository = {
  dashboard: async () => {
    const dto = await apiClient.get<{
      date: string;
      today: {
        sales: string;
        bills: number;
        items: string;
        refunds: { count: number; amount: string };
        sales_change: string | null;
        bills_change: string | null;
        items_change: string | null;
      };
      low_stock_count: number;
      series_7: { date: string; sales: string }[];
      series_30: { date: string; sales: string }[];
      categories: {
        name: string;
        tint: string;
        revenue: string;
        share: string;
      }[];
      top_products: {
        product_id: number;
        name: string;
        units: string;
        revenue: string;
      }[];
      low_stock: { product_id: number; name: string; stock: string }[];
    }>("/reports/dashboard");
    return {
      date: dto.date,
      sales: dto.today.sales,
      bills: dto.today.bills,
      items: dto.today.items,
      refunds: dto.today.refunds,
      salesChange: dto.today.sales_change,
      billsChange: dto.today.bills_change,
      itemsChange: dto.today.items_change,
      lowStockCount: dto.low_stock_count,
      series7: dto.series_7,
      series30: dto.series_30,
      categories: dto.categories,
      topProducts: dto.top_products.map((p) => ({
        productId: p.product_id,
        name: p.name,
        units: p.units,
        revenue: p.revenue,
      })),
      lowStock: dto.low_stock.map((i) => ({
        productId: i.product_id,
        name: i.name,
        stock: i.stock,
      })),
    };
  },
  summary: async (range, group) => {
    const dto = await apiClient.get<{
      kpis: {
        revenue: string;
        gross_profit: string;
        bills: number;
        average_bill: string;
        refund_count: number;
      };
      periods: {
        period: string;
        end: string;
        revenue: string;
        gross_profit: string;
        bills: number;
      }[];
    }>(`/reports/summary?${rangeQuery(range, { group })}`);
    return {
      revenue: dto.kpis.revenue,
      grossProfit: dto.kpis.gross_profit,
      bills: dto.kpis.bills,
      averageBill: dto.kpis.average_bill,
      refundCount: dto.kpis.refund_count,
      periods: dto.periods.map((p) => ({
        period: p.period,
        end: p.end,
        revenue: p.revenue,
        grossProfit: p.gross_profit,
        bills: p.bills,
      })),
    };
  },
  categories: (range) =>
    apiClient.get<CategoryRow[]>(`/reports/categories?${rangeQuery(range)}`),
  cashiers: async (range, limit) => {
    const dto = await apiClient.get<{
      total_cashiers: number;
      refund_count: number;
      results: {
        cashier_id: number;
        name: string;
        is_active: boolean;
        bills: number;
        revenue: string;
      }[];
    }>(`/reports/cashiers?${rangeQuery(range, { limit: String(limit) })}`);
    return {
      totalCashiers: dto.total_cashiers,
      refundCount: dto.refund_count,
      rows: dto.results.map((r) => ({
        cashierId: r.cashier_id,
        name: r.name,
        isActive: r.is_active,
        bills: r.bills,
        revenue: r.revenue,
      })),
    };
  },
  money: async (range, group) => {
    const dto = await apiClient.get<{
      group: "day" | "month";
      periods: MoneyPeriodDto[];
      totals: MoneyPeriodDto & {
        deliveries: number;
        profit_margin: string;
        refund_rate: string;
      };
    }>(`/reports/money?${rangeQuery(range, { group })}`);
    return {
      group: dto.group,
      periods: dto.periods.map(toMoneyPeriod),
      totals: {
        ...toMoneyPeriod(dto.totals),
        deliveries: dto.totals.deliveries,
        profitMargin: dto.totals.profit_margin,
        refundRate: dto.totals.refund_rate,
      },
    };
  },
  refundsByCashier: async (range) => {
    const rows = await apiClient.get<
      {
        cashier_id: number;
        name: string;
        is_active: boolean;
        refunds_count: number;
        refunds_amount: string;
      }[]
    >(`/reports/refunds-by-cashier?${rangeQuery(range)}`);
    return rows.map((r) => ({
      cashierId: r.cashier_id,
      name: r.name,
      isActive: r.is_active,
      refundsCount: r.refunds_count,
      refundsAmount: r.refunds_amount,
    }));
  },
  exportCsv: (report, range, group) =>
    apiClient.get<Blob>(
      `/reports/export?${rangeQuery(range, { report, ...(group ? { group } : {}) })}`,
      { as: "blob" },
    ),
};
