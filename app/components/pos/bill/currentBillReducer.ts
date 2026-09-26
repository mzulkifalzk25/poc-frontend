import {
  addProduct,
  changeQuantity,
  removeLine,
  setQuantity,
  type DraftLine,
  type ScannedProduct,
} from "~/domain/bill";
import type { PaymentMethod } from "~/domain/payment";

export interface CurrentBillState {
  lines: DraftLine[];
  lastProductId: number | null;
  method: PaymentMethod;
  received: string;
}

export type CurrentBillAction =
  | { type: "add"; product: ScannedProduct }
  | { type: "setQty"; productId: number; qty: number }
  | { type: "change"; productId: number; delta: number }
  | { type: "remove"; productId: number }
  | { type: "replace"; lines: DraftLine[] }
  | { type: "method"; method: PaymentMethod }
  | { type: "received"; text: string }
  | { type: "clear" };

export const EMPTY_BILL: CurrentBillState = {
  lines: [],
  lastProductId: null,
  method: "cash",
  received: "",
};

export function currentBillReducer(
  state: CurrentBillState,
  action: CurrentBillAction,
): CurrentBillState {
  switch (action.type) {
    case "add":
      return {
        ...state,
        lines: addProduct(state.lines, action.product),
        lastProductId: action.product.productId,
      };
    case "setQty":
      return {
        ...state,
        lines: setQuantity(state.lines, action.productId, action.qty),
        lastProductId: action.productId,
      };
    case "change":
      return {
        ...state,
        lines: changeQuantity(state.lines, action.productId, action.delta),
      };
    case "remove":
      return { ...state, lines: removeLine(state.lines, action.productId) };
    case "replace":
      return { ...EMPTY_BILL, lines: action.lines };
    case "method":
      return { ...state, method: action.method };
    case "received":
      return { ...state, received: action.text };
    case "clear":
      return EMPTY_BILL;
  }
}
