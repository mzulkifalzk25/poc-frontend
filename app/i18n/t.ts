import { en, type Strings } from "./strings";

// Single seam for locale switching later; always English for now.
export function t(): Strings {
  return en;
}
