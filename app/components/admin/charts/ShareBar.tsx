export interface ShareSegment {
  label: string;
  share: number;
  className: string;
}

// One horizontal bar split into shares that add up to 100.
export function ShareBar({
  label,
  segments,
}: {
  label: string;
  segments: ShareSegment[];
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className="flex h-3.5 w-full overflow-hidden rounded-pill bg-off-white"
    >
      {segments.map((segment) => (
        <span
          key={segment.label}
          className={segment.className}
          style={{ width: `${String(segment.share)}%` }}
        />
      ))}
    </div>
  );
}
