const CODE_LENGTH = 8;
const HALF = CODE_LENGTH / 2;

export function normalizeActivationCode(input: string): string {
  const characters = input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, CODE_LENGTH);
  if (characters.length <= HALF) {
    return characters;
  }
  return `${characters.slice(0, HALF)}-${characters.slice(HALF)}`;
}

export function isCompleteActivationCode(code: string): boolean {
  return /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code);
}
