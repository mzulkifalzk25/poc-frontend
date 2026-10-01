export interface PasswordChangeDraft {
  current: string;
  next: string;
  again: string;
}

export type PasswordChangeErrors = Partial<
  Record<"current" | "next" | "again", "required" | "mismatch" | "same">
>;

export function checkPasswordChange(
  draft: PasswordChangeDraft,
): PasswordChangeErrors {
  const errors: PasswordChangeErrors = {};
  if (draft.current === "") {
    errors.current = "required";
  }
  if (draft.next === "") {
    errors.next = "required";
  } else if (draft.next === draft.current) {
    errors.next = "same";
  }
  if (draft.next !== draft.again) {
    errors.again = "mismatch";
  }
  return errors;
}
