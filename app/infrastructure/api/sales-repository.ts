import type { BillDetail, BillRow, SalesPage, SalesQuery } from "~/domain/sale";
import type { PaymentMethod } from "~/domain/payment";

import { apiClient } from "./client";

export const SALES_PAGE_SIZE = 25;

interface BillRowDto {
  id: string;
  bill_no: string;
  time: string;
  cashier: string;
  items: string;
  payment: PaymentMethod | null;
  total: string;
  status: BillRow["status"];
}

interface ListDto {
  summary: { bills: number; total: string };
  results: BillRowDto[];
  next_cursor: string | null;
}

interface DetailDto {
  id: string;
  bill_no: string;
  time: string;
  status: BillRow["status"];
  cashier: { id: number; name: string };
  counter: { name: string };
  payment: {
    method: PaymentMethod;
    amount: string;
    tendered: string | null;
    change_given: string | null;
  } | null;
  items: {
    line_no: number;
    name: string;
    barcode: string;
    qty: string;
    unit_price: string;
    line_total: string;
  }[];
  totals: { subtotal: string; tax: string; rounding: string; total: string };
  returns: { id: string; refund_total: string; refund_method: string }[];
}

function toRow(dto: BillRowDto): BillRow {
  return {
    id: dto.id,
    billNo: dto.bill_no,
    time: dto.time,
    cashier: dto.cashier,
    items: dto.items,
    payment: dto.payment,
    total: dto.total,
    status: dto.status,
  };
}

export interface SalesRepository {
  list: (query: SalesQuery, cursor: string | null) => Promise<SalesPage>;
  detail: (id: string) => Promise<BillDetail>;
}

export const salesRepository: SalesRepository = {
  list: async (query, cursor) => {
    const params = new URLSearchParams({
      date: query.date,
      limit: String(SALES_PAGE_SIZE),
    });
    if (query.cashierId !== null) {
      params.set("cashier", String(query.cashierId));
    }
    if (query.payment !== null) {
      params.set("payment", query.payment);
    }
    if (query.search !== "") {
      params.set("search", query.search);
    }
    if (cursor) {
      params.set("cursor", cursor);
    }
    const dto = await apiClient.get<ListDto>(`/bills?${params.toString()}`);
    return {
      bills: dto.results.map(toRow),
      nextCursor: dto.next_cursor,
      count: dto.summary.bills,
      total: dto.summary.total,
    };
  },
  detail: async (id) => {
    const dto = await apiClient.get<DetailDto>(`/bills/${id}`);
    return {
      id: dto.id,
      billNo: dto.bill_no,
      time: dto.time,
      status: dto.status,
      cashier: dto.cashier.name,
      counterName: dto.counter.name,
      payment: dto.payment && {
        method: dto.payment.method,
        amount: dto.payment.amount,
        tendered: dto.payment.tendered,
        changeGiven: dto.payment.change_given,
      },
      items: dto.items.map((item) => ({
        lineNo: item.line_no,
        name: item.name,
        barcode: item.barcode,
        qty: item.qty,
        unitPrice: item.unit_price,
        lineTotal: item.line_total,
      })),
      totals: dto.totals,
      returns: dto.returns.map((r) => ({
        id: r.id,
        refundTotal: r.refund_total,
        refundMethod: r.refund_method,
      })),
    };
  },
};
