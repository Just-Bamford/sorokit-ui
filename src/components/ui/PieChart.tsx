/**
 * PieChart — a pure-SVG donut/pie chart with no external charting library.
 *
 * Renders accessible SVG with ARIA labels and a colour-keyed legend.
 * Each slice supports an optional tooltip via `title` element.
 */

import React from "react";

import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PieSlice {
  /** Unique key for the slice */
  key: string;
  /** Display label */
  label: string;
  /** Numeric value (raw; percentages are computed from the sum of all values) */
  value: number;
  /** Tailwind or CSS colour class / hex string.  Falls back to SLICE_COLORS. */
  color?: string;
}

export interface PieChartProps {
  slices: PieSlice[];
  /** Total diameter in pixels (default 160) */
  size?: number;
  /** Donut hole radius as a fraction 0–1 (default 0.55, set to 0 for a solid pie) */
  innerRadius?: number;
  /** Show the percentage legend below the chart (default true) */
  showLegend?: boolean;
  /** Optional label rendered in the centre of the donut hole */
  centerLabel?: React.ReactNode;
  className?: string;
  /** Aria-label for the SVG element */
  ariaLabel?: string;
}

// ─── Palette ─────────────────────────────────────────────────────────────────

/**
 * Ordered palette of fill colours.  Colours cycle when there are more slices
 * than entries.
 */
export const SLICE_COLORS = [
  "#5645D4", // brand (violet)
  "#14B8A6", // teal
  "#22C55E", // green
  "#F97316", // orange
  "#A855F7", // purple
  "#EAB308", // yellow
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
  "#F43F5E", // rose
];

function resolveColor(slice: PieSlice, index: number): string {
  return slice.color ?? SLICE_COLORS[index % SLICE_COLORS.length];
}

// ─── Arc math ─────────────────────────────────────────────────────────────────

interface ArcParams {
  cx: number;
  cy: number;
  r: number;
  startAngle: number; // radians
  endAngle: number; // radians
}

/**
 * Build an SVG arc path string for a pie/donut slice.
 *
 * When `innerR` is 0 a solid wedge from the centre is drawn instead of a ring.
 */
function arcPath(
  { cx, cy, r, startAngle, endAngle }: ArcParams,
  innerR: number,
): string {
  const cos = Math.cos;
  const sin = Math.sin;

  const x1o = cx + r * cos(startAngle);
  const y1o = cy + r * sin(startAngle);
  const x2o = cx + r * cos(endAngle);
  const y2o = cy + r * sin(endAngle);

  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  if (innerR <= 0) {
    return [
      `M ${cx} ${cy}`,
      `L ${x1o} ${y1o}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2o} ${y2o}`,
      "Z",
    ].join(" ");
  }

  const x1i = cx + innerR * cos(endAngle);
  const y1i = cy + innerR * sin(endAngle);
  const x2i = cx + innerR * cos(startAngle);
  const y2i = cy + innerR * sin(startAngle);

  return [
    `M ${x1o} ${y1o}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${x2o} ${y2o}`,
    `L ${x1i} ${y1i}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2i} ${y2i}`,
    "Z",
  ].join(" ");
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PieChart({
  slices,
  size = 160,
  innerRadius = 0.55,
  showLegend = true,
  centerLabel,
  className,
  ariaLabel,
}: PieChartProps) {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2; // 2px padding so stroke doesn't clip
  const innerR = r * innerRadius;

  // Generate a stable random ID outside of render for the legend
   
  const legendIdRef = React.useRef<string | null>(null);
  if (legendIdRef.current == null) {
    const randomPart = Array.from({ length: 5 }, () =>
      // eslint-disable-next-line react-hooks/purity
      Math.floor(Math.random() * 16).toString(16),
    ).join("");
    legendIdRef.current = `pie-legend-${randomPart}`;
  }
  // eslint-disable-next-line react-hooks/refs
  const legendId = legendIdRef.current;

  // Build arc segments.  Start at -90° (top) and go clockwise.
  const segments = React.useMemo(() => {
    const result: Array<{
      slice: PieSlice;
      color: string;
      path: string;
      pct: number;
    }> = [];
    let angle = -Math.PI / 2;
    for (const [i, slice] of slices.entries()) {
      const sweep = (slice.value / total) * (2 * Math.PI);
      const start = angle;
      const end = angle + sweep;
      const pct = (slice.value / total) * 100;
      const color = resolveColor(slice, i);
      const path = arcPath(
        { cx, cy, r, startAngle: start, endAngle: end },
        innerR,
      );
      result.push({ slice, color, path, pct });
      angle = end;
    }
    return result;
  }, [slices, total, cx, cy, r, innerR]);

  // Empty state — render a grey placeholder ring
  if (total === 0 || slices.length === 0) {
    return (
      <div className={cn("flex flex-col items-center gap-4", className)}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={ariaLabel ?? "Empty portfolio chart"}
        >
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={r - innerR}
            className="text-surface-2"
          />
          {centerLabel && (
            <foreignObject
              x={innerR}
              y={innerR}
              width={innerR * 2}
              height={innerR * 2}
            >
              <div className="w-full h-full flex items-center justify-center text-center">
                {centerLabel}
              </div>
            </foreignObject>
          )}
        </svg>
        {showLegend && <p className="text-[11px] text-ink-3">No data</p>}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={ariaLabel ?? "Portfolio allocation chart"}
          aria-describedby={showLegend ? legendId : undefined}
        >
          {segments.map(({ slice, color, path, pct }) => (
            <path
              key={slice.key}
              d={path}
              fill={color}
              className="transition-opacity duration-150 hover:opacity-80"
            >
              <title>
                {slice.label}: {pct.toFixed(1)}%
              </title>
            </path>
          ))}
        </svg>

        {/* Centre label (renders on top of the SVG via absolute positioning) */}
        {centerLabel && (
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ padding: r - innerR + 4 }}
          >
            <div className="text-center">{centerLabel}</div>
          </div>
        )}
      </div>

      {showLegend && (
        <ul
          id={legendId}
          className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 max-w-[240px]"
          aria-label="Chart legend"
        >
          {segments.map(({ slice, color, pct }) => (
            <li key={slice.key} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-[11px] text-ink-2">
                {slice.label}{" "}
                <span className="text-ink-3 tabular-nums">
                  {pct.toFixed(1)}%
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
