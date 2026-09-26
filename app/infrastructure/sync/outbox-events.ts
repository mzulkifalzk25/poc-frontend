export const OUTBOX_CHANGED = "martdesk:outbox-changed";

// Tells the upload worker (and the status pill) that something was queued.
export function notifyOutboxChanged(): void {
  window.dispatchEvent(new Event(OUTBOX_CHANGED));
}
