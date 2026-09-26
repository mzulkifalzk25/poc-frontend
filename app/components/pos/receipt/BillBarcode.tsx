import { encodeCode128B } from "~/domain/code128";

import { barRects } from "./barRects";

const MODULE_PX = 1.4;
const HEIGHT = 44;

// The bill number as a Code 128 barcode, so a receipt can be scanned on Returns.
export function BillBarcode({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  const { bars, total } = barRects(encodeCode128B(value), MODULE_PX);
  return (
    <svg
      role="img"
      aria-label={label}
      width={total}
      height={HEIGHT}
      viewBox={`0 0 ${String(total)} ${String(HEIGHT)}`}
      className="mx-auto"
    >
      {bars.map((bar) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={0}
          width={bar.width}
          height={HEIGHT}
          fill="#000"
        />
      ))}
    </svg>
  );
}
