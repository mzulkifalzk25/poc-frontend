export interface BarRect {
  x: number;
  width: number;
}

// Turns alternating bar/space widths (bar first) into drawable bars.
export function barRects(
  widths: number[],
  moduleWidth: number,
): { bars: BarRect[]; total: number } {
  const bars: BarRect[] = [];
  let x = 0;
  widths.forEach((width, index) => {
    if (index % 2 === 0) {
      bars.push({ x, width: width * moduleWidth });
    }
    x += width * moduleWidth;
  });
  return { bars, total: x };
}
