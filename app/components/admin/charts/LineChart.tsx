interface Series {
  name: string;
  color: string;
  values: number[];
}

interface LineChartProps {
  label: string;
  series: Series[];
  xLabels: string[];
}

const WIDTH = 560;
const HEIGHT = 170;
const PAD = 8;

function path(values: number[], max: number): string {
  const step = values.length > 1 ? (WIDTH - PAD * 2) / (values.length - 1) : 0;
  return values
    .map((value, index) => {
      const x = PAD + index * step;
      const y =
        HEIGHT - PAD - (max > 0 ? (value / max) * (HEIGHT - PAD * 2) : 0);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function LineChart({ label, series, xLabels }: LineChartProps) {
  const max = Math.max(...series.flatMap((s) => s.values), 0);
  return (
    <div className="flex flex-col gap-2">
      <svg
        role="img"
        aria-label={label}
        viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
        className="h-44 w-full"
        preserveAspectRatio="none"
      >
        {series.map((item) => (
          <path
            key={item.name}
            d={path(item.values, max)}
            fill="none"
            stroke={item.color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div className="flex justify-between font-mono text-[11px] text-text-secondary">
        {xLabels.map((text) => (
          <span key={text}>{text}</span>
        ))}
      </div>
    </div>
  );
}
