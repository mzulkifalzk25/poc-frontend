import type { ProductFieldError } from "~/domain/product-draft";
import { t } from "~/i18n/t";

export type FieldMessages = Partial<Record<string, string>>;

function camelCase(name: string): string {
  return name.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

// Server field names are snake_case; form fields are camelCase.
export function fieldMessages(
  local: Partial<Record<string, ProductFieldError>>,
  server: Record<string, string> = {},
): FieldMessages {
  const messages: FieldMessages = {};
  for (const [name, message] of Object.entries(server)) {
    messages[camelCase(name)] = message;
  }
  for (const [name, code] of Object.entries(local)) {
    if (code) {
      messages[name] = t().productForm.fieldErrors[code];
    }
  }
  return messages;
}
