import type { CompletedReturn } from "~/domain/return";

import { toReturnUpload } from "../api/return-upload";
import { db as appDb, type MartDeskDatabase } from "./database";
import { newOutboxRow } from "./outbox-store";

function raiseStock(qty: string | undefined, returned: number): string {
  return (
    (Math.round(Number(qty ?? "0") * 1000) + Math.round(returned * 1000)) /
    1000
  ).toFixed(3);
}

export function createReturnStore(database: MartDeskDatabase) {
  return {
    // ONE transaction: outbox row, stock back on the shelf, and the refund on this shift's drawer figures.
    recordReturn: (ret: CompletedReturn, now: number) =>
      database.transaction(
        "rw",
        [database.returns_outbox, database.stock, database.shifts],
        async () => {
          await database.returns_outbox.add(
            newOutboxRow(toReturnUpload(ret), now),
          );
          if (ret.restock) {
            for (const line of ret.lines) {
              const row = await database.stock.get(line.productId);
              await database.stock.put({
                productId: line.productId,
                qty: raiseStock(row?.qty, line.qty),
              });
            }
          }
          const shift = await database.shifts.get(ret.shiftId);
          if (!shift) {
            throw new Error(`Shift ${ret.shiftId} is not on this PC`);
          }
          const refunds = [
            ...(shift.refunds ?? []),
            { amount: ret.refund, paidFromDrawer: ret.method === "cash" },
          ];
          await database.shifts.update(ret.shiftId, { refunds });
        },
      ),
  };
}

export type ReturnStore = ReturnType<typeof createReturnStore>;

export const returnStore = createReturnStore(appDb);
