import { toWriteFailure, type WriteOutcome } from "./admin-write";
import {
  validateDelivery,
  type DeliveryDraft,
  type DeliveryError,
  type DeliveryPayload,
} from "~/domain/delivery";

export interface Supplier {
  id: number;
  name: string;
  phone: string;
}

export interface ReceiptResult {
  id: number;
  totalCost: string;
  costIncreases: { productId: number; name: string }[];
}

export interface SupplierRepository {
  list: () => Promise<Supplier[]>;
  create: (name: string, phone: string) => Promise<Supplier>;
}

export interface ReceiptRepository {
  createDraft: (payload: DeliveryPayload) => Promise<number>;
  confirm: (id: number, key: string) => Promise<ReceiptResult>;
}

export type ConfirmOutcome =
  WriteOutcome<ReceiptResult> | { status: "rejected"; error: DeliveryError };

// A failed confirm keeps the draft: pass `draftId` to retry without a second draft.
export async function confirmDelivery(
  repo: ReceiptRepository,
  draft: DeliveryDraft,
  state: { draftId: number | null; key: string },
): Promise<ConfirmOutcome & { draftId?: number }> {
  const validation = validateDelivery(draft);
  if (!validation.ok) {
    return { status: "rejected", error: validation.error };
  }
  let draftId = state.draftId;
  try {
    draftId ??= await repo.createDraft(validation.payload);
    const value = await repo.confirm(draftId, state.key);
    return { status: "done", value, draftId };
  } catch (error) {
    return {
      ...toWriteFailure(error),
      ...(draftId === null ? {} : { draftId }),
    };
  }
}
