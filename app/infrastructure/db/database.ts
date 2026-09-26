import Dexie, { type EntityTable } from "dexie";

export interface MetaRow {
  key: string;
  value: unknown;
}

export class MartDeskDatabase extends Dexie {
  meta!: EntityTable<MetaRow, "key">;

  constructor(name = "martdesk") {
    super(name);
    this.version(1).stores({ meta: "key" });
  }
}

export const db = new MartDeskDatabase();
