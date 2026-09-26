import { Button } from "~/components/ui/Button";
import { Dialog } from "~/components/ui/Dialog";
import { formatMoney, formatPaisa } from "~/domain/money";
import { t } from "~/i18n/t";
import type { ShiftServerResult } from "~/infrastructure/db/rows";

interface ShiftClosedDialogProps {
  counted: string;
  expected: number;
  server: ShiftServerResult | null;
  onSignOut: () => void;
}

function ServerLine({ server }: { server: ShiftServerResult | null }) {
  const strings = t().endShift.closed;
  if (!server) {
    return <p className="font-semibold text-warning">{strings.notUploaded}</p>;
  }
  return (
    <>
      <p>{strings.serverExpected(formatMoney(server.expectedCash))}</p>
      <p
        className={`font-semibold ${server.mismatch ? "text-warning" : "text-success-text"}`}
      >
        {server.mismatch ? strings.serverMismatch : strings.serverMatches}
      </p>
    </>
  );
}

// The shift is already closed on this PC; this only reports what happened and signs out.
export function ShiftClosedDialog({
  counted,
  expected,
  server,
  onSignOut,
}: ShiftClosedDialogProps) {
  const strings = t().endShift.closed;
  return (
    <Dialog
      title={strings.title}
      onClose={onSignOut}
      footer={
        <Button size="lg" autoFocus onClick={onSignOut}>
          {strings.signOut}
        </Button>
      }
    >
      <p>{strings.counted(formatMoney(counted), formatPaisa(expected))}</p>
      <ServerLine server={server} />
    </Dialog>
  );
}
