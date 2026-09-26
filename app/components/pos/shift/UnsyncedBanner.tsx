import { t } from "~/i18n/t";

interface UnsyncedBannerProps {
  count: number;
  syncing: boolean;
  onSyncNow: () => void;
}

export function UnsyncedBanner({
  count,
  syncing,
  onSyncNow,
}: UnsyncedBannerProps) {
  const strings = t().endShift;
  return (
    <div
      role="alert"
      className="flex items-center gap-3.5 rounded-card bg-warning-bg px-[18px] py-3.5 text-[#6E3A06]"
    >
      <p className="flex-grow text-[15px]">
        <b>{strings.unsynced(count)}</b> {strings.unsyncedHint}
      </p>
      <button
        type="button"
        disabled={syncing}
        onClick={onSyncNow}
        className="flex h-11 items-center rounded-input bg-[#6E3A06] px-[18px] text-sm font-bold text-white transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none active:brightness-125 disabled:opacity-60"
      >
        {syncing ? strings.syncing : strings.syncNow}
      </button>
    </div>
  );
}
