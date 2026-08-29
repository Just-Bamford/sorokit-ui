/**
 * ValidatorCard — displays a single validator's metrics.
 *
 * Shows: logo/avatar, name, status badge, commission, APY, uptime,
 * total staked, delegator count, and an optional "Delegate" CTA.
 */

import {
  Award01Icon,
  Globe02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Delegation, Validator } from "@/lib/staking";
import { formatPct, formatXlm } from "@/lib/staking";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ValidatorCardProps {
  validator: Validator;
  /** Current user delegation to this validator, if any */
  delegation?: Delegation;
  /** Called when the user clicks "Delegate" */
  onDelegate?: (validatorId: string) => void;
  /** Whether a delegation action is in-flight for this validator */
  isActing?: boolean;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadgeVariant(
  status: Validator["status"],
): "success" | "error" | "default" {
  if (status === "active") return "success";
  if (status === "jailed") return "error";
  return "default";
}

function statusLabel(status: Validator["status"]): string {
  if (status === "active") return "Active";
  if (status === "jailed") return "Jailed";
  return "Inactive";
}

function uptimeVariant(pct: number): "success" | "warning" | "error" {
  if (pct >= 99) return "success";
  if (pct >= 95) return "warning";
  return "error";
}

/** Fallback letter-avatar when no logo URL is provided */
function ValidatorAvatar({ name, logoUrl }: { name: string; logoUrl?: string }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${name} logo`}
        className="w-9 h-9 rounded-full bg-surface-2 object-cover shrink-0"
        onError={(e) => {
          // Fall back to initials avatar on load error
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      aria-hidden="true"
      className="w-9 h-9 rounded-full bg-brand-dim text-brand flex items-center justify-center text-[12px] font-bold shrink-0 select-none"
    >
      {initials}
    </span>
  );
}

// ─── Metric cell ──────────────────────────────────────────────────────────────

function MetricCell({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-4">
        {label}
      </span>
      <span className={cn("text-[13px] font-semibold text-ink leading-snug", valueClassName)}>
        {value}
      </span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ValidatorCard({
  validator,
  delegation,
  onDelegate,
  isActing = false,
  className,
}: ValidatorCardProps) {
  const {
    id,
    name,
    logoUrl,
    commissionPct,
    apyPct,
    uptimePct,
    totalStaked,
    delegatorCount,
    status,
    rank,
    website,
  } = validator;

  const hasDelegation = delegation != null && parseFloat(delegation.amount) > 0;

  return (
    <article
      aria-label={`Validator ${name}`}
      className={cn(
        "rounded-xl border border-line bg-surface overflow-hidden transition-shadow hover:shadow-sm",
        status === "jailed" && "opacity-70",
        className,
      )}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <ValidatorAvatar name={name} logoUrl={logoUrl} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-[13px] font-semibold text-ink leading-snug truncate">
                {name}
              </h3>
              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${name} website`}
                  className="text-ink-3 hover:text-ink-2 transition-colors shrink-0"
                >
                  <HugeiconsIcon
                    icon={Globe02Icon}
                    size={12}
                    color="currentColor"
                    strokeWidth={1.5}
                  />
                </a>
              )}
            </div>
            <span className="text-[11px] text-ink-3">Rank #{rank}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Badge variant={statusBadgeVariant(status)} dot>
            {statusLabel(status)}
          </Badge>
          {hasDelegation && (
            <Badge variant="primary">
              <HugeiconsIcon icon={Award01Icon} size={10} color="currentColor" strokeWidth={2} />
              Delegating
            </Badge>
          )}
        </div>
      </div>

      {/* ── Metrics grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-3 px-4 pb-3 border-b border-line">
        <MetricCell
          label="APY"
          value={formatPct(apyPct)}
          valueClassName="text-green"
        />
        <MetricCell
          label="Commission"
          value={formatPct(commissionPct)}
        />
        <MetricCell
          label="Uptime"
          value={
            <span
              className={cn(
                uptimeVariant(uptimePct) === "success" && "text-green",
                uptimeVariant(uptimePct) === "warning" && "text-orange",
                uptimeVariant(uptimePct) === "error" && "text-red",
              )}
            >
              {formatPct(uptimePct)}
            </span>
          }
        />
        <MetricCell
          label="Total Staked"
          value={formatXlm(parseFloat(totalStaked), 0)}
        />
        <MetricCell
          label="Delegators"
          value={
            <span className="flex items-center gap-1">
              <HugeiconsIcon
                icon={UserGroupIcon}
                size={11}
                color="currentColor"
                strokeWidth={1.5}
                className="text-ink-3"
              />
              {delegatorCount.toLocaleString()}
            </span>
          }
        />
        {hasDelegation && (
          <MetricCell
            label="My Delegation"
            value={formatXlm(delegation!.amount)}
            valueClassName="text-brand"
          />
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        {hasDelegation ? (
          <span className="text-[11px] text-ink-3">
            Claimable:{" "}
            <span className="text-green font-semibold">
              {formatXlm(delegation!.claimableReward)}
            </span>
          </span>
        ) : (
          <span className="text-[11px] text-ink-4">No active delegation</span>
        )}

        {onDelegate && (
          <Button
            size="sm"
            variant={hasDelegation ? "secondary" : "primary"}
            disabled={status === "jailed" || isActing}
            loading={isActing}
            onClick={() => onDelegate(id)}
            aria-label={`${hasDelegation ? "Manage delegation to" : "Delegate to"} ${name}`}
          >
            {hasDelegation ? "Manage" : "Delegate"}
          </Button>
        )}
      </div>
    </article>
  );
}
