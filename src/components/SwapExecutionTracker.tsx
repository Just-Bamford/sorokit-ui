import { AssetPill } from "@/components/AssetBadge";
import { Badge } from "@/components/ui/Badge";
import type { SwapSuggestion } from "@/lib/rebalancer";
import { formatPct } from "@/lib/rebalancer";

export interface SwapExecutionTrackerProps {
  swap: SwapSuggestion;
  txHash?: string | null;
  executedAt?: string | null;
  actualOutput?: number | null;
  slippageThresholdPct?: number;
  priceImpactPct?: number;
  explorerUrl?: string | null;
  className?: string;
}

function formatTimestamp(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function getSlippageState(slippagePct: number, thresholdPct?: number) {
  if (thresholdPct == null) {
    return { label: "Within threshold", tone: "success" as const };
  }
  if (slippagePct > thresholdPct) {
    return { label: "Warning: slippage exceeded threshold", tone: "warning" as const };
  }
  return { label: "Within threshold", tone: "success" as const };
}

export function SwapExecutionTracker({
  swap,
  txHash,
  executedAt,
  actualOutput,
  slippageThresholdPct,
  priceImpactPct,
  explorerUrl,
  className,
}: SwapExecutionTrackerProps) {
  const expectedMinimumOutput = swap.toAmountExpected;
  const resolvedActualOutput = actualOutput ?? expectedMinimumOutput;
  const actualSlippagePct = expectedMinimumOutput > 0
    ? ((expectedMinimumOutput - resolvedActualOutput) / expectedMinimumOutput) * 100
    : 0;
  const { label, tone } = getSlippageState(actualSlippagePct, slippageThresholdPct);

  return (
    <div className={className ?? "rounded-xl border border-line bg-surface overflow-hidden"}>
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <h3 className="text-[14px] font-semibold text-ink">Swap execution tracker</h3>
          <p className="text-[12px] text-ink-3 mt-0.5">Live execution details and slippage monitoring</p>
        </div>
        <Badge variant={tone === "warning" ? "warning" : "success"}>{label}</Badge>
      </div>

      <div className="flex flex-col gap-4 px-5 py-4">
        <div className="grid gap-3 md:grid-cols-2">
          <MetricCard title="Source" value={`${swap.fromAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${swap.from}`} icon={<AssetPill assetCode={swap.from} />} />
          <MetricCard title="Destination" value={`${resolvedActualOutput.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${swap.to}`} icon={<AssetPill assetCode={swap.to} />} />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard title="Price impact" value={formatPct(priceImpactPct ?? swap.slippagePct)} />
          <MetricCard title="Expected minimum output" value={`${expectedMinimumOutput.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${swap.to}`} />
          <MetricCard title="Actual output" value={`${resolvedActualOutput.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${swap.to}`} />
        </div>

        <div className="rounded-lg border border-line bg-surface-2 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold text-ink">Slippage</p>
              <p className="text-[11px] text-ink-3">Calculated as (min_output - actual) / min_output × 100</p>
            </div>
            <div className={tone === "warning" ? "text-red" : "text-success"}>
              <p className="text-[13px] font-semibold">{formatPct(actualSlippagePct)}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-ink-3">
          <div className="flex items-center gap-2">
            <span aria-hidden="true">↗</span>
            <span>Executed {formatTimestamp(executedAt)}</span>
          </div>
          {txHash ? (
            <a
              href={explorerUrl ?? `https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-brand underline-offset-2 hover:underline"
              aria-label="View on explorer"
            >
              <span aria-hidden="true">↗</span>
              View on explorer
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon }: { title: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-4">{title}</p>
        {icon}
      </div>
      <p className="mt-2 text-[13px] font-medium text-ink">{value}</p>
    </div>
  );
}
