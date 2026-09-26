import type { CompletedBill } from "~/domain/completed-bill";

import { toBillUpload } from "../api/bill-upload";
import { db as appDb, type MartDeskDatabase } from "./database";
import { META_KEYS } from "./meta-keys";
import { newOutboxRow } from "./outbox-store";

function billSequence(billNo: string): number {
  return Number(billNo.slice(3));
}

// Quantities have 3 decimals, so the maths runs in whole thousandths. Stock may go below zero.
function lowerStock(qty: string | undefined, sold: number): string {
  const after = Math.round(Number(qty ?? "0") * 1000) - Math.round(sold * 1000);
  return (after / 1000).toFixed(3);
}

export function createSaleStore(database: MartDeskDatabase) {
  return {
    // ONE transaction: outbox row, local stock, bill sequence and the recent bill.
    recordSale: (bill: CompletedBill, now: number) =>
      database.transaction(
        "rw",
        [
          database.bills_outbox,
          database.stock,
          database.meta,
          database.recent_bills,
        ],
        async () => {
          await database.bills_outbox.add(
            newOutboxRow(toBillUpload(bill), now),
          );
          for (const line of bill.lines) {
            const row = await database.stock.get(line.productId);
            await database.stock.put({
              productId: line.productId,
              qty: lowerStock(row?.qty, line.qty),
            });
          }
          const seq = (await database.meta.get(META_KEYS.billSeq))?.value;
          const current = typeof seq === "number" ? seq : 0;
          await database.meta.put({
            key: META_KEYS.billSeq,
            value: Math.max(current, billSequence(bill.billNo)),
          });
          await database.recent_bills.put({
            id: bill.id,
            billNo: bill.billNo,
            soldAt: bill.soldAt,
            shiftId: bill.shiftId,
            bill,
          });
        },
      ),
  };
}

export type SaleStore = ReturnType<typeof createSaleStore>;

export const saleStore = createSaleStore(appDb);
