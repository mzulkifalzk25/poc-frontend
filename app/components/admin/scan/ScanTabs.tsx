import { t } from "~/i18n/t";

export type ScanTab = "camera" | "usb";

interface ScanTabsProps {
  value: ScanTab;
  onChange: (tab: ScanTab) => void;
}

const TABS: ScanTab[] = ["camera", "usb"];

export function ScanTabs({ value, onChange }: ScanTabsProps) {
  const strings = t().scanAdd.tabs;
  return (
    <div
      role="tablist"
      aria-label={strings.label}
      className="flex h-11 gap-1 rounded-input bg-border p-[3px]"
    >
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={value === tab}
          className={`flex flex-grow items-center justify-center rounded-lg text-sm transition focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none ${
            value === tab
              ? "bg-white font-semibold text-text"
              : "font-medium text-text-secondary hover:bg-white/60 active:bg-white/80"
          }`}
          onClick={() => {
            onChange(tab);
          }}
        >
          {strings[tab]}
        </button>
      ))}
    </div>
  );
}
