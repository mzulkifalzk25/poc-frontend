export const META_KEYS = {
  cursors: "syncCursors",
  firstSyncDone: "firstSyncDone",
  lastSyncAt: "lastSyncAt",
  settings: "settings",
  billSeq: "billSeq",
  clockOffsetMs: "clockOffsetMs",
} as const;

export interface SyncCursors {
  products: string;
  stock: string;
}
