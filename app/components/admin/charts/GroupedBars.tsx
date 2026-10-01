export type BarTone = "blue" | "gold" | "red" | "sky";

const toneClass: Record<BarTone, string> = {
  blue: "bg-blue",
  gold: "bg-gold",
  red: "bg-error",
  sky: "bg-[#6B9AC4]",
};

export interface Group {
  label: string;
  caption?: string;
  values: { value: number; tone: BarTone }[];
}

interface GroupedBarsProps {
  label: string;
  groups: Group[];
  height?: number;
}

// Side-by-side bars per group, all on one scale.
export function GroupedBars({ label, groups, height = 180 }: GroupedBarsProps) {
  const max = Math.max(
    ...groups.flatMap((group) => group.values.map((v) => v.value)),
    0,
  );
  return (
    <div role="img" aria-label={label} className="flex items-end gap-3">
      {groups.map((group) => (
        <div
          key={group.label}
          className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
        >
          {group.caption && (
            <span className="font-mono text-[11px] font-semibold text-text-secondary">
              {group.caption}
            </span>
          )}
          <div
            className="flex w-full items-end justify-center gap-1"
            style={{ height }}
          >
            {group.values.map((item, index) => (
              <span
                key={index}
                className={`block w-full max-w-5 rounded-t-md ${toneClass[item.tone]}`}
                style={{
                  height: `${String(max > 0 ? Math.max((item.value / max) * 100, item.value > 0 ? 1.5 : 0) : 0)}%`,
                }}
              />
            ))}
          </div>
          <span className="truncate text-[11px] font-medium text-text-secondary">
            {group.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Legend({
  items,
}: {
  items: { label: string; tone: BarTone }[];
}) {
  return (
    <ul className="flex flex-wrap gap-4 text-xs font-medium text-text-secondary">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={`h-2.5 w-2.5 rounded-full ${toneClass[item.tone]}`}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
