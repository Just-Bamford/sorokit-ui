import { Refresh01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { useSorokit } from "@/context/useSorokit";
import { cn, toXLM } from "@/lib/utils";

export interface FeeData {
  baseFee: string;
  recommended: string;
}

interface FeeEstimatorProps {
  className?: string;
  /** Auto-refresh interval in ms. 0 = no refresh. */
  refreshInterval?: number;
  /** Compact single-line display variant. */
  compact?: boolean;
  /** Callback fired when fee data loads successfully. */
  onFeeLoad?: (fee: FeeData) => void;
}

export function FeeEstimator({
  className,
  refreshInterval = 0,
  compact,
  onFeeLoad,
}: FeeEstimatorProps) {
  const { client } = useSorokit();
  const [fee, setFee] = useState<FeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      const { data, error: err } = await client.transaction.estimateFee();
      if (err) {
        setError(err);
        return;
      }
      setFee(data);
      setError(null);
      if (data) {
        onFeeLoad?.(data);
      }
    } finally {
      setLoading(false);
    }
  }, [client, onFeeLoad]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void load();
    }, 0);
    if (refreshInterval > 0) {
      const id = setInterval(() => {
        void load();
      }, refreshInterval);
      return () => {
        window.clearTimeout(timerId);
        clearInterval(id);
      };
    }
    return () => {
      window.clearTimeout(timerId);
    };
  }, [load, refreshInterval]);

  const compactContent = fee
    ? `Base: ${fee.baseFee} stroops · Recommended: ${fee.recommended} stroops`
    : null;

  return (
    <div
      role="region"
      aria-label="Network fee estimate"
      className={cn(
        compact
          ? "inline-flex items-center gap-2"
          : "rounded-xl border border-line bg-surface overflow-hidden",
        className,
      )}
    >
      {compact ? (
        <div aria-live="polite" aria-atomic="true">
          {loading && !fee ? (
            <span className="text-[11px] text-ink-3">Loading…</span>
          ) : error ? (
            <span className="text-[11px] text-red">{error}</span>
          ) : fee ? (
            <span className="text-[11px] text-ink">{compactContent}</span>
          ) : null}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <div>
              <h3 className="text-[13px] font-semibold text-ink">Network Fee</h3>
              <p className="text-[11px] text-ink-3 mt-0.5">
                Current Stellar base fee estimate
              </p>
            </div>
            <Tooltip content="Refresh">
              <button
                onClick={() => void load()}
                disabled={loading}
                className="p-1.5 rounded-lg hover:bg-surface-2 text-ink-3 hover:text-ink-2 transition-colors disabled:opacity-40"
                aria-label="Refresh fee estimate"
              >
                <HugeiconsIcon
                  icon={Refresh01Icon}
                  size={14}
                  color="currentColor"
                  strokeWidth={1.5}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </Tooltip>
          </div>

          <div className="px-5 py-4" aria-live="polite" aria-atomic="true">
            {loading && !fee ? (
              <div className="flex gap-4">
                <div className="h-8 w-24 rounded-lg bg-surface-2 animate-pulse" />
                <div className="h-8 w-24 rounded-lg bg-surface-2 animate-pulse" />
              </div>
            ) : error ? (
              <p className="text-[12px] text-red">{error}</p>
            ) : fee ? (
              <div className="flex items-center gap-4">
                <FeeCell label="Base Fee" value={fee.baseFee} unit="stroops" />
                <div className="w-px h-8 bg-line" />
                <FeeCell
                  label="Recommended"
                  value={fee.recommended}
                  unit="stroops"
                  highlight
                  highFee={
                    parseInt(fee.recommended, 10) > parseInt(fee.baseFee, 10) * 2
                  }
                />
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

export function FeeCell({
  label,
  value,
  unit,
  highlight,
  highFee,
}: {
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
  highFee?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-4">
          {label}
        </span>
        {highFee && <Badge variant="warning">High fee</Badge>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "text-[18px] font-semibold leading-none",
            highlight ? "text-brand" : "text-ink",
          )}
        >
          {Number.isNaN(parseInt(value, 10)) ? "—" : value}
        </span>
        <span className="text-[10px] text-ink-3">{unit}</span>
      </div>
      <span className="text-[10px] text-ink-3">
        {Number.isNaN(parseInt(value, 10)) ? "(≈ — XLM)" : `(≈ ${toXLM(value)} XLM)`}
      </span>
    </div>
  );
}
