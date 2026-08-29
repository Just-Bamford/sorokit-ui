/**
 * AllocationInput — lets the user set target allocation percentages for each
 * asset in their portfolio.
 *
 * Features:
 * - Numeric input per asset clamped to 0–100
 * - Live sum indicator with colour feedback (red when ≠ 100, green when exact)
 * - "Equalise" button distributes 100% evenly across all assets
 * - "Reset" button restores the current-allocation percentages
 * - Per-asset diff pill showing how much each target deviates from current
 */

import { SLICE_COLORS } from "@/components/ui/PieChart";
import type { PortfolioAsset } from "@/lib/rebalancer";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AllocationInputProps {
  assets: PortfolioAsset[];
  /** Controlled map of assetCode → target percentage (0–100) */
  targets: Record<string, number>;
  onChange: (updated: Record<string, number>) => void;
  disabled?: boolean;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sumTargets(targets: Record<string, number>): number {
  return Object.values(targets).reduce((s, v) => s + (isNaN(v) ? 0 : v), 0);
}

function diffLabel(diff: number): string {
  if (Math.abs(diff) < 0.01) return "";
  return diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AllocationInput({
  assets,
  targets,
  onChange,
  disabled = false,
  className,
}: AllocationInputProps) {
  const sum = sumTargets(targets);
  const remaining = parseFloat((100 - sum).toFixed(4));
  const isExact = Math.abs(remaining) < 0.01;
  const isOver = remaining < -0.01;

  function handleChange(assetCode: string, raw: string) {
    const parsed = parseFloat(raw);
    const value = isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));
    onChange({ ...targets, [assetCode]: value });
  }

  function handleEqualise() {
    if (assets.length === 0) return;
    const equal = parseFloat((100 / assets.length).toFixed(4));
    // Give the last asset any rounding remainder so the total is exactly 100
    const last = parseFloat((100 - equal * (assets.length - 1)).toFixed(4));
    const updated: Record<string, number> = {};
    assets.forEach((a, i) => {
      updated[a.assetCode] = i === assets.length - 1 ? last : equal;
    });
    onChange(updated);
  }

  function handleReset() {
    const updated: Record<string, number> = {};
    assets.forEach((a) => {
      updated[a.assetCode] = parseFloat(a.currentPct.toFixed(2));
    });
    onChange(updated);
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-ink-2">Target Allocation</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={handleEqualise}
            className="text-[11px] text-brand hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Equalise
          </button>
          <span className="text-ink-4 text-[11px]">·</span>
          <button
            type="button"
            disabled={disabled}
            onClick={handleReset}
            className="text-[11px] text-ink-2 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Per-asset rows */}
      <div className="flex flex-col gap-2">
        {assets.map((asset, i) => {
          const target = targets[asset.assetCode] ?? 0;
          const diff = target - asset.currentPct;
          const label = diffLabel(diff);
          const color = SLICE_COLORS[i % SLICE_COLORS.length];

          return (
            <div key={asset.assetCode} className="flex items-center gap-3">
              {/* Colour swatch */}
              <span
                aria-hidden="true"
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: color }}
              />

              {/* Asset code */}
              <span className="text-[13px] font-medium text-ink w-14 shrink-0 truncate">
                {asset.assetCode}
              </span>

              {/* Progress bar (shows current vs. target) */}
              <div
                className="flex-1 h-1.5 rounded-full bg-surface-2 overflow-hidden"
                aria-hidden="true"
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, target)}%`,
                    backgroundColor: color,
                    opacity: 0.7,
                  }}
                />
              </div>

              {/* Diff pill */}
              {label && (
                <span
                  className={cn(
                    "text-[10px] font-semibold w-12 text-right tabular-nums shrink-0",
                    diff > 0 ? "text-green" : "text-orange",
                  )}
                  aria-label={`Difference: ${label}`}
                >
                  {label}
                </span>
              )}

              {/* Numeric input */}
              <div className="relative shrink-0">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={target === 0 ? "" : target}
                  placeholder="0"
                  disabled={disabled}
                  aria-label={`Target allocation for ${asset.assetCode}`}
                  onChange={(e) => handleChange(asset.assetCode, e.target.value)}
                  className={cn(
                    "h-8 w-20 rounded-lg border bg-surface-2 pl-3 pr-6",
                    "text-[12px] text-ink tabular-nums",
                    "outline-none transition-colors",
                    "border-line focus:border-line-2 focus:ring-1 focus:ring-brand-dim",
                    "disabled:opacity-40 disabled:cursor-not-allowed",
                    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                  )}
                />
                <span
                  aria-hidden="true"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-ink-3 pointer-events-none"
                >
                  %
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sum indicator */}
      <div
        className={cn(
          "flex items-center justify-between rounded-lg px-3.5 py-2.5 border text-[12px] font-medium transition-colors",
          isExact
            ? "bg-success-dim border-success-dim-strong text-green"
            : isOver
              ? "bg-error-dim border-error-dim-strong text-red"
              : "bg-surface-2 border-line text-ink-2",
        )}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span>Total</span>
        <span className="tabular-nums">
          {sum.toFixed(1)}%
          {!isExact && (
            <span className="ml-1.5 font-normal text-[11px]">
              {isOver
                ? `(${Math.abs(remaining).toFixed(1)}% over)`
                : `(${remaining.toFixed(1)}% remaining)`}
            </span>
          )}
        </span>
      </div>

      {isOver && (
        <p role="alert" className="text-[11px] text-red">
          Total allocation exceeds 100%. Reduce one or more targets.
        </p>
      )}
    </div>
  );
}
