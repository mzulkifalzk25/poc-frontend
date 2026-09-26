import { useState } from "react";
import { useLoaderData, useNavigate, useRevalidator } from "react-router";

import { useCurrentBill } from "~/components/pos/bill/CurrentBillProvider";
import { HeldBillCard } from "~/components/pos/held/HeldBillCard";
import { ConfirmDialog } from "~/components/ui/ConfirmDialog";
import { EmptyState } from "~/components/ui/StateBlocks";
import { t } from "~/i18n/t";
import { heldBillStore } from "~/infrastructure/db/held-bill-store";
import { shiftStore } from "~/infrastructure/db/shift-store";
import { getDeviceCounter } from "~/infrastructure/session/device-store";
import { STORE_TIME_ZONE } from "~/infrastructure/store-time-zone";
import {
  deleteHeldDeps,
  heldBillDeps,
} from "~/infrastructure/sync/held-bill-deps";
import { deleteHeldBill, recallBill } from "~/use_cases/held-bills";

export async function clientLoader() {
  const counter = await getDeviceCounter();
  const shift = counter ? await shiftStore.current(counter.id) : null;
  return { held: shift ? await heldBillStore.listForShift(shift.id) : [] };
}

function TrashIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export default function HeldRoute() {
  const { held } = useLoaderData<typeof clientLoader>();
  const { state, dispatch } = useCurrentBill();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; tag: string } | null>(
    null,
  );
  const [pending, setPending] = useState(false);
  const strings = t().held;
  const close = () => void navigate("/pos");

  async function recall(id: string) {
    const result = await recallBill(heldBillDeps, id, state.lines);
    if (result.status === "recalled") {
      dispatch({ type: "replace", lines: result.lines });
      close();
      return;
    }
    setError(result.status === "busy" ? strings.busy : strings.missing);
    void revalidator.revalidate();
  }

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    setPending(true);
    await deleteHeldBill(deleteHeldDeps, deleting.id);
    setPending(false);
    setDeleting(null);
    void revalidator.revalidate();
  }

  return (
    <div
      className="fixed inset-0 top-16 z-30 flex items-center justify-center bg-navy/60 p-4"
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="held-title"
        className="flex max-h-full w-[760px] max-w-full flex-col gap-5 overflow-y-auto rounded-[22px] bg-white p-[30px] text-text shadow-[0_24px_60px_rgba(15,39,66,0.35)]"
      >
        <header className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h2
              id="held-title"
              className="font-heading text-[28px] font-bold tracking-[-0.02em]"
            >
              {strings.title}
            </h2>
            <p className="text-sm text-text-secondary">{strings.hint}</p>
          </div>
          <button
            type="button"
            aria-label={strings.close}
            autoFocus
            onClick={close}
            className="flex h-12 w-12 items-center justify-center rounded-lg border border-border transition hover:bg-off-white focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none active:bg-border"
          >
            <CloseIcon />
          </button>
        </header>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-warning-bg px-4 py-3 text-sm font-semibold text-warning"
          >
            {error}
          </p>
        )}
        {held.length === 0 ? (
          <EmptyState title={strings.empty.title} hint={strings.empty.hint} />
        ) : (
          held.map((bill, index) => (
            <HeldBillCard
              key={bill.id}
              bill={bill}
              index={index}
              now={new Date()}
              timeZone={STORE_TIME_ZONE}
              onRecall={() => void recall(bill.id)}
              deleteButton={
                <button
                  type="button"
                  aria-label={strings.delete(strings.tag(index))}
                  onClick={() => {
                    setDeleting({ id: bill.id, tag: strings.tag(index) });
                  }}
                  className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-white text-error-text transition hover:bg-error-bg focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none active:brightness-95"
                >
                  <TrashIcon />
                </button>
              }
            />
          ))
        )}
        <p className="text-center text-xs text-text-secondary">
          {strings.footer}
        </p>
      </section>
      {deleting && (
        <ConfirmDialog
          title={strings.deleteTitle(deleting.tag)}
          confirmLabel={strings.deleteConfirm}
          pending={pending}
          onConfirm={() => void confirmDelete()}
          onCancel={() => {
            setDeleting(null);
          }}
        >
          <p>{strings.deleteBody}</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
