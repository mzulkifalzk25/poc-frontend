export const FIRST_CURSOR = "0";
export const CURSOR_OVERLAP_SECONDS = 10;

// Cursors are opaque; a timestamp cursor is moved back so no change is missed.
export function withOverlap(cursor: string | null): string {
  if (cursor === null || cursor === FIRST_CURSOR) {
    return FIRST_CURSOR;
  }
  if (!/^\d{4}-\d{2}-\d{2}T/.test(cursor)) {
    return cursor;
  }
  const time = Date.parse(cursor);
  if (Number.isNaN(time)) {
    return cursor;
  }
  return new Date(time - CURSOR_OVERLAP_SECONDS * 1000).toISOString();
}
