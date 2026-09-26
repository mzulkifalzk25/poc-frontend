import { isApiError } from "~/infrastructure/api/errors";

export type WriteOutcome<T> =
  | { status: "done"; value: T }
  | { status: "invalid"; fields: Record<string, string> }
  | { status: "conflict"; code: string; message: string }
  | { status: "offline" }
  | { status: "failed"; message: string };

function firstMessages(
  fields: Record<string, string[]>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [name, messages] of Object.entries(fields)) {
    const first = messages[0];
    if (first) {
      result[name] = first;
    }
  }
  return result;
}

export function toWriteFailure(error: unknown): WriteOutcome<never> {
  if (error instanceof TypeError) {
    return { status: "offline" };
  }
  if (!isApiError(error)) {
    throw error;
  }
  if (error.status === 409) {
    return { status: "conflict", code: error.code, message: error.message };
  }
  if (error.fields && Object.keys(error.fields).length > 0) {
    return { status: "invalid", fields: firstMessages(error.fields) };
  }
  return { status: "failed", message: error.message };
}

export async function runAdminWrite<T>(
  write: () => Promise<T>,
): Promise<WriteOutcome<T>> {
  try {
    return { status: "done", value: await write() };
  } catch (error) {
    return toWriteFailure(error);
  }
}
