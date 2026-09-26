export const META_KEYS = {
  cursors: "syncCursors",
  firstSyncDone: "firstSyncDone",
  lastSyncAt: "lastSyncAt",
  settings: "settings",
  billSeq: "billSeq",
  clockOffsetMs: "clockOffsetMs",
  pinDelays: "pinDelays",
} as const;

export interface SyncCursors {
  products: string;
  stock: string;
  people: string;
}
