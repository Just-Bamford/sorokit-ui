/**
 * RewardHistory — displays earned rewards over the last 30 days.
 *
 * Shows a hand-rolled SVG bar chart (matching the project's PieChart approach)
 * and a tabular breakdown of individual reward events.
 */

import type { DailyReward, RewardEvent, Validator } from "@/lib/staking";
import {
  formatXlm,
  REWARD_HISTORY_DAYS,
  totalRewardHistoryXlm,
} from "@/lib/staking";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RewardHistoryProps {
  /** Aggregated daily buckets (from aggregateDailyRewards()) */
  dailyRewards: DailyReward[];
  /** Raw reward events for the table */
  events: RewardEvent[];
  validators: Validator[];
  className?: string;
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

const CHART_WIDTH = 560;
const CHART_HEIGHT = 80;
const BAR_GAP = 2;

function RewardBarChart({ data }: { data: DailyReward[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-[12px] text-ink-3">
        No reward data
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.totalXlm), 0.001);
  const barW = Math.max(
    1,
    (CHART_WIDTH - BAR_GAP * (data.length - 1)) / data.length,
  );

  return (
    <svg
      role="img"
      aria-label={`Reward history bar chart — last ${REWARD_HISTORY_DAYS} days`}
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      className="w-full h-20 overflow-visible"
      preserveAspectRatio="none"
    >
      <title>Reward history — last {REWARD_HISTORY_DAYS} days</title>
      {data.map((day, i) => {
        const barHeight = Math.max(2, (day.totalXlm / maxVal) * CHART_HEIGHT);
        const x = i * (barW + BAR_GAP);
        const y = CHART_HEIGHT - barHeight;
        return (
          <g key={day.date}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barHeight}
              rx={1.5}
              className="fill-brand opacity-70 hover:opacity-100 transition-opacity"
            />
            <title>
              {day.date}: {day.totalXlm.toFixed(4)} XLM
            </title>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validatorName(validators: Validator[], id: string): string {
  return validators.find((v) => v.id === id)?.name ?? id;
}

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function truncateTxHash(hash: string): string {
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RewardHistory({
  dailyRewards,
  events,
  validators,
  className,
}: RewardHistoryProps) {
  const total = totalRewardHistoryXlm(dailyRewards);

  // Most recent events first, capped at 50 rows for display
  const sortedEvents = [...events]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 50);

  return (
    <div className={cn("flex flex-col gap-5", className)}>

      {/* ── Summary header ──────────────────────────────────────────────────── */}
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-4">
            Last {REWARD_HISTORY_DAYS} Days
          </p>
          <p className="text-[20px] font-semibold text-green leading-tight mt-0.5">
            {formatXlm(total)}
          </p>
        </div>
        {dailyRewards.length > 0 && (
          <span className="text-[11px] text-ink-3">
            {dailyRewards.length} reward days
          </span>
        )}
      </div>

      {/* ── Bar chart ───────────────────────────────────────────────────────── */}
      <div className="rounded-lg bg-surface-2 border border-line px-3 pt-3 pb-2">
        <RewardBarChart data={dailyRewards} />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-ink-4">
            {dailyRewards[0]?.date ?? ""}
          </span>
          <span className="text-[10px] text-ink-4">
            {dailyRewards[dailyRewards.length - 1]?.date ?? ""}
          </span>
        </div>
      </div>

      {/* ── Event table ─────────────────────────────────────────────────────── */}
      {sortedEvents.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-line bg-surface-2">
                <th
                  scope="col"
                  className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-4 whitespace-nowrap"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-4 whitespace-nowrap"
                >
                  Validator
                </th>
                <th
                  scope="col"
                  className="text-right px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-4 whitespace-nowrap"
                >
                  Amount
                </th>
                <th
                  scope="col"
                  className="text-right px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-4 whitespace-nowrap"
                >
                  Tx
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedEvents.map((event) => (
                <tr
                  key={event.id}
                  className="border-b border-line last:border-b-0 hover:bg-surface-2 transition-colors"
                >
                  <td className="px-4 py-2.5 text-ink-2 whitespace-nowrap">
                    {formatEventDate(event.date)}
                  </td>
                  <td className="px-4 py-2.5 text-ink truncate max-w-[160px]">
                    {validatorName(validators, event.validatorId)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-green whitespace-nowrap">
                    +{parseFloat(event.amount).toFixed(4)} XLM
                  </td>
                  <td className="px-4 py-2.5 text-right text-ink-3 whitespace-nowrap">
                    {event.txHash ? (
                      <span
                        title={event.txHash}
                        className="font-mono text-[11px]"
                      >
                        {truncateTxHash(event.txHash)}
                      </span>
                    ) : (
                      <span className="text-ink-4">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-[12px] text-ink-3 text-center py-6">
          No reward history in the last {REWARD_HISTORY_DAYS} days.
        </p>
      )}
    </div>
  );
}
