import { ConfirmDialog } from "~/components/ui/ConfirmDialog";
import { t } from "~/i18n/t";

import type { useArchiveProduct } from "./useArchiveProduct";

export function ArchiveConfirm({
  archive,
}: {
  archive: ReturnType<typeof useArchiveProduct>;
}) {
  const strings = t().productArchive;
  if (!archive.target) {
    return null;
  }
  return (
    <ConfirmDialog
      title={strings.confirmTitle(archive.target.name)}
      confirmLabel={strings.confirm}
      pending={archive.pending}
      error={archive.error}
      onConfirm={() => void archive.confirm()}
      onCancel={archive.cancel}
    >
      <p>{strings.dangerBody}</p>
    </ConfirmDialog>
  );
}

export function ArchiveNotice({ archived }: { archived: boolean }) {
  const strings = t().productArchive;
  return archived ? (
    <div className="flex flex-col gap-1.5 rounded-lg bg-border px-4 py-3.5 text-[13px] leading-normal text-text">
      <p className="font-bold">{strings.archivedTitle}</p>
      <p>{strings.archivedBody}</p>
    </div>
  ) : (
    <div className="flex flex-col gap-1.5 rounded-lg bg-error-bg px-4 py-3.5 text-[13px] leading-normal text-[#7A140C]">
      <p className="font-bold">{strings.dangerTitle}</p>
      <p>{strings.dangerBody}</p>
    </div>
  );
}
