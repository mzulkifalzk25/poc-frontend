import { toPaisa } from "~/domain/paisa";
import { parseAmountInput } from "~/domain/product-draft";

// The cash typed as received, in paisa; null while it is empty or not a number.
export function receivedPaisa(text: string): number | null {
  const amount = parseAmountInput(text, 2);
  return amount === null ? null : toPaisa(amount);
}
