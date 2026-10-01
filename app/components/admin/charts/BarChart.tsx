export interface Bar {
  label: string;
  value: number;
  caption: string;
  highlight?: boolean;
}

interface BarChartProps {
  label: string;
  bars: Bar[];
}

// One bar per period, scaled to the tallest; the caption sits above each bar.
export function BarChart({ label, bars }: BarChartProps) {
  const max = Math.max(...bars.map((bar) => bar.value), 0);
  return (
    <div role="img" aria-label={label} className="flex h-52 items-end gap-2">
      {bars.map((bar) => {
        const height =
          max > 0
            ? Math.max((bar.value / max) * 100, bar.value > 0 ? 2 : 0)
            : 0;
        return (
          <div
            key={bar.label}
            className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1.5 text-center"
          >
            <span className="truncate font-mono text-[11px] font-semibold text-text-secondary">
              {bar.caption}
            </span>
            <span
              className={`block w-full rounded-t-md ${bar.highlight ? "bg-gold" : "bg-blue"}`}
              style={{ height: `${String(height)}%` }}
            />
            <span className="truncate text-[11px] font-medium text-text-secondary">
              {bar.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
