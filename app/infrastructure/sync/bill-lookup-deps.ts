import type { LookupBillDeps, RemoteBillLine } from "~/use_cases/lookup-bill";

import { apiClient } from "../api/client";
import { counterClock } from "../clock";
import { recentBillStore } from "../db/recent-bill-store";
import { getSession } from "../session/session-store";

interface LookupResponse {
  bill_no: string;
  lines: {
    product_id: number;
    unit_price: string;
    returnable_qty: string | number;
  }[];
}

async function fetchRemote(billNo: string): Promise<RemoteBillLine[]> {
  const answer = await apiClient.get<LookupResponse>(
    `/bills/lookup?bill_no=${encodeURIComponent(billNo)}`,
  );
  return answer.lines.map((line) => ({
    productId: line.product_id,
    unitPrice: line.unit_price,
    returnableQty: Number(line.returnable_qty),
  }));
}

// GET /bills/lookup is for signed-in cashiers only (role C); an offline sign-in has no token for it.
export function billLookupDeps(): LookupBillDeps {
  return {
    findLocal: (billNo) =>
      recentBillStore.findRecent(billNo, counterClock.now()),
    fetchRemote: getSession()?.accessToken ? fetchRemote : null,
  };
}
