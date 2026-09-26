export function polar(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

export function describeDonutSlice(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const sweep = endAngle - startAngle;
  if (sweep <= 0) return '';
  if (sweep >= 359.99) {
    return [
      describeDonutSlice(cx, cy, outerRadius, innerRadius, 0, 180),
      describeDonutSlice(cx, cy, outerRadius, innerRadius, 180, 360),
    ].join(' ');
  }

  const largeArc = sweep > 180 ? 1 : 0;
  const p1 = polar(cx, cy, outerRadius, startAngle);
  const p2 = polar(cx, cy, outerRadius, endAngle);
  const p3 = polar(cx, cy, innerRadius, endAngle);
  const p4 = polar(cx, cy, innerRadius, startAngle);

  return [
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

import { useMemo } from 'react';

export function useDonutSlices<T extends { count: number }>(
  data: T[],
  total: number,
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number
) {
  return useMemo(() => {
    let angle = 0;
    return data
      .filter((item) => item.count > 0)
      .map((item) => {
        const sweep = total > 0 ? (item.count / total) * 360 : 0;
        const start = angle;
        const end = angle + sweep;
        angle = end;
        return {
          ...item,
          d: describeDonutSlice(cx, cy, outerRadius, innerRadius, start, end),
        };
      });
  }, [cx, cy, data, total, outerRadius, innerRadius]);
}
