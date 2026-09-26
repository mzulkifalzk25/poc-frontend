import { t } from "~/i18n/t";
import type { WriteOutcome } from "~/use_cases/admin-write";

export function writeErrorMessage(
  outcome: WriteOutcome<unknown>,
): string | null {
  const errors = t().admin.errors;
  switch (outcome.status) {
    case "done":
    case "invalid":
      return null;
    case "offline":
      return errors.offline;
    case "conflict":
      return outcome.message;
    case "failed":
      return errors.failed;
  }
}
