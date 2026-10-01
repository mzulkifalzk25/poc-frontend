import type {
  ReceiptRepository,
  Supplier,
  SupplierRepository,
} from "~/use_cases/receive-stock";

import { apiClient } from "./client";

export const supplierRepository: SupplierRepository = {
  list: () => apiClient.get<Supplier[]>("/suppliers"),
  create: (name, phone) =>
    apiClient.post<Supplier>("/suppliers", { name, phone }),
};

interface ConfirmDto {
  id: number;
  total_cost: string;
  cost_increase_items: { product_id: number; name: string }[];
}

export const receiptRepository: ReceiptRepository = {
  createDraft: async (payload) => {
    const receipt = await apiClient.post<{ id: number }>("/stock/receipts", {
      supplier_id: payload.supplierId,
      invoice_no: payload.invoiceNo,
      delivery_date: payload.deliveryDate,
      lines: payload.lines.map((line) => ({
        product_id: line.productId,
        qty: line.qty,
        unit_cost: line.unitCost,
      })),
    });
    return receipt.id;
  },
  confirm: async (id, key) => {
    const dto = await apiClient.post<ConfirmDto>(
      `/stock/receipts/${String(id)}/confirm`,
      undefined,
      { headers: { "Idempotency-Key": key } },
    );
    return {
      id: dto.id,
      totalCost: dto.total_cost,
      costIncreases: dto.cost_increase_items.map((item) => ({
        productId: item.product_id,
        name: item.name,
      })),
    };
  },
};
