import { fromPaisa } from "~/domain/paisa";
import type { CompletedReturn } from "~/domain/return";

import type { ReturnUpload } from "../db/rows";

// The contract's /returns/batch shape; the server prices the lines itself and flags differences.
export function toReturnUpload(ret: CompletedReturn): ReturnUpload {
  return {
    id: ret.id,
    shift_id: ret.shiftId,
    lines: ret.lines.map((line) => ({
      product_id: line.productId,
      qty: line.qty.toFixed(3),
    })),
    reason: ret.reason,
    restock: ret.restock,
    refund: { method: ret.method, amount: fromPaisa(ret.refund) },
    ...(ret.billNo ? { original_bill_no: ret.billNo } : {}),
    returned_at: ret.returnedAt,
  };
}
