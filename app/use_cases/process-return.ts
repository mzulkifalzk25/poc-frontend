import {
  completeReturn,
  type CompleteReturnInput,
  type CompletedReturn,
} from "~/domain/return";

export interface ProcessReturnDeps {
  recordReturn: (ret: CompletedReturn, now: number) => Promise<void>;
  onSaved: () => void;
  now: () => number;
}

export type ProcessReturnResult =
  { status: "saved"; ret: CompletedReturn } | { status: "not_saved" };

// Saved on this PC first; it uploads after any older unsent bills.
export async function processReturn(
  deps: ProcessReturnDeps,
  input: CompleteReturnInput,
): Promise<ProcessReturnResult> {
  const ret = completeReturn(input);
  try {
    await deps.recordReturn(ret, deps.now());
  } catch {
    return { status: "not_saved" };
  }
  deps.onSaved();
  return { status: "saved", ret };
}
