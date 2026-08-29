import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useSorokit } from "@/context/useSorokit";
import type { ClaimableBalance } from "@/lib/client";
import { cn, safeFormat, truncateAddress } from "@/lib/utils";

function isPredicateExpired(predicate: unknown, _currentTime: number): boolean {
  if (!predicate || typeof predicate !== "object") return false;
  const p = predicate as Record<string, unknown>;
  if (p.unconditional === true) return false;
  if (typeof p.timeBound === "object" && p.timeBound !== null) {
    const tb = p.timeBound as Record<string, unknown>;
    if (typeof tb.end === "number" && _currentTime > tb.end) return true;
    if (typeof tb.start === "number" && _currentTime < tb.start) return true;
  }
  if (typeof p.endTime === "number" && _currentTime > p.endTime) return true;
  if (Array.isArray(p.and)) return p.and.every((child: unknown) => isPredicateExpired(child, _currentTime));
  if (Array.isArray(p.or)) return p.or.some((child: unknown) => isPredicateExpired(child, _currentTime));
  if (typeof p.not === "object" && p.not !== null) return !isPredicateExpired(p.not, _currentTime);
  return false;
}

interface BalanceRowProps {
  cb: ClaimableBalance;
  confirmThreshold?: string;
  currentTime?: number;
  /** Called with the balance's id once it has been successfully claimed. */
  onClaimed?: (id: string) => void;
}

function BalanceRow({ cb, confirmThreshold, currentTime = Date.now(), onClaimed }: BalanceRowProps) {
  const { client } = useSorokit();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const confirmRef = useRef<HTMLDialogElement>(null);

  const rawCode = cb.asset.includes(":") ? cb.asset.split(":")[0] : cb.asset;
  const assetCode = rawCode === "native" ? "XLM" : rawCode;
  const amountNum = parseFloat(cb.amount);
  const expired = cb.claimants.some((c) => isPredicateExpired(c.predicate, currentTime));

  async function handleClaim() {
    if (confirmThreshold && amountNum >= parseFloat(confirmThreshold)) {
      setShowConfirm(true);
      return;
    }
    await doClaim();
  }

  async function doClaim() {
    if (!client) return;
    setClaiming(true);
    setClaimError(null);
    setShowConfirm(false);
    try {
      const { data, error } = await client.account.claimBalance(cb.id);
      if (error) {
        setClaimError(error);
        return;
      }
      if (!data) {
        setClaimError("Claim did not complete — please try again");
        return;
      }
      setClaimed(true);
      onClaimed?.(cb.id);
    } finally {
      setClaiming(false);
    }
  }

  function handleCopyId() {
    navigator.clipboard.writeText(cb.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1600);
  }

  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-line last:border-0 gap-4">
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-ink">
            {safeFormat(cb.amount)}
          </span>
          <Badge variant="teal">{assetCode}</Badge>
          {expired && <Badge variant="error">Expired</Badge>}
          {claimed && (
            <Badge variant="success" dot live>
              Claimed
            </Badge>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-4">
            Sponsor
          </span>
          <span data-address>{truncateAddress(cb.sponsor, 8, 6)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-ink-3">{truncateAddress(cb.id, 8, 6)}</span>
          <button
            onClick={handleCopyId}
            aria-label={copiedId ? "Balance ID copied" : "Copy balance ID"}
            className="text-ink-4 hover:text-ink-2 transition-colors text-[10px] p-0.5"
          >
            {copiedId ? "✓" : "⎘"}
          </button>
        </div>
      </div>
      {!claimed && (
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Button
            size="sm"
            loading={claiming}
            disabled={expired}
            onClick={handleClaim}
            className={cn("shrink-0", expired && "opacity-40 cursor-not-allowed")}
          >
            Claim
          </Button>
          {claimError && (
            <span className="text-[10px] text-red max-w-[150px] text-right truncate">
              {claimError}
            </span>
          )}
        </div>
      )}

      {showConfirm && (
        <dialog
          ref={confirmRef}
          open
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <div className="rounded-xl border border-line bg-surface p-6 max-w-sm w-full shadow-xl">
            <h4 className="text-[14px] font-semibold text-ink mb-2">Confirm Claim</h4>
            <p className="text-[13px] text-ink-2 mb-4">
              You are about to claim {safeFormat(cb.amount)} {assetCode}. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setShowConfirm(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={doClaim}>
                Confirm
              </Button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}

export interface ClaimableBalanceCardProps {
  confirmThreshold?: string;
}

export function ClaimableBalanceCard({ confirmThreshold }: ClaimableBalanceCardProps) {
  const { isConnected, address, client } = useSorokit();
  const [balances, setBalances] = useState<ClaimableBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address || !client) {
      return;
    }

    let active = true;
    const timerId = window.setTimeout(() => {
      setLoading(true);
      client
        .account.getClaimableBalances(address)
        .then(({ data, error: err }) => {
          if (!active) return;
          if (err) {
            setError(err);
            return;
          }
          setBalances(data ?? []);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timerId);
    };
  }, [address, client]);

  function handleClaimed(id: string) {
    setBalances((prev) => prev.filter((b) => b.id !== id));
  }

  if (!isConnected) return null;

  return (
    <div className="rounded-xl border border-line bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-line">
        <div>
          <h3 className="text-[14px] font-semibold text-ink">
            Claimable Balances
          </h3>
          <p className="text-[12px] text-ink-3 mt-0.5">
            Pending balances available to claim
          </p>
        </div>
        {!loading && balances.length > 0 && (
          <Badge variant="warning">{balances.length} pending</Badge>
        )}
      </div>

      {loading ? (
        <SkeletonCard
          className="rounded-none border-0"
          structure={
            <div className="px-5 py-5 flex flex-col gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="h-4 w-28 rounded bg-surface-2 animate-pulse" />
                    <div className="h-3 w-36 rounded bg-surface-2 animate-pulse" />
                  </div>
                  <div className="h-8 w-16 rounded-lg bg-surface-2 animate-pulse" />
                </div>
              ))}
            </div>
          }
        />
      ) : error ? (
        <p className="text-[13px] text-red text-center py-10">{error}</p>
      ) : balances.length === 0 ? (
        <p className="text-[13px] text-ink-3 text-center py-10">
          No claimable balances
        </p>
      ) : (
        <div>
          {balances.map((cb) => (
            <BalanceRow
              key={cb.id}
              cb={cb}
              confirmThreshold={confirmThreshold}
              onClaimed={handleClaimed}
            />
          ))}
        </div>
      )}
    </div>
  );
}
