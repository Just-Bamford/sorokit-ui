import type { Balance } from "@/lib/client";
import { cn, truncateAddress } from "@/lib/utils";

const ASSET_COLORS: Record<string, { bg: string; text: string }> = {
  XLM: { bg: "bg-[rgba(20,184,166,0.12)]", text: "text-teal" },
  yXLM: { bg: "bg-[rgba(34,197,94,0.12)]", text: "text-green" },
  USDC: { bg: "bg-[rgba(86,69,212,0.12)]", text: "text-brand" },
  USDT: { bg: "bg-success-dim-strong", text: "text-green" },
  BTC: { bg: "bg-[rgba(249,115,22,0.12)]", text: "text-orange" },
  ETH: { bg: "bg-[rgba(168,85,247,0.12)]", text: "text-purple" },
  AQUA: { bg: "bg-[rgba(59,130,246,0.12)]", text: "text-blue" },
  SHX: { bg: "bg-[rgba(236,72,153,0.12)]", text: "text-pink" },
  BLND: { bg: "bg-[rgba(236,204,41,0.12)]", text: "text-yellow" },
};

const FALLBACK_COLOR_PALETTE = [
  { bg: "bg-[rgba(168,85,247,0.12)]", text: "text-purple" },
  { bg: "bg-[rgba(59,130,246,0.12)]", text: "text-blue" },
  { bg: "bg-[rgba(236,72,153,0.12)]", text: "text-pink" },
  { bg: "bg-[rgba(236,204,41,0.12)]", text: "text-yellow" },
  { bg: "bg-[rgba(34,197,94,0.12)]", text: "text-green" },
  { bg: "bg-[rgba(249,115,22,0.12)]", text: "text-orange" },
  { bg: "bg-[rgba(14,165,233,0.12)]", text: "text-cyan" },
  { bg: "bg-[rgba(229,57,53,0.12)]", text: "text-red" },
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function getAssetColor(code: string) {
  if (ASSET_COLORS[code]) {
    return ASSET_COLORS[code];
  }
  const hash = hashCode(code);
  return FALLBACK_COLOR_PALETTE[hash % FALLBACK_COLOR_PALETTE.length];
}

interface AssetBadgeProps {
  balance: Balance;
  showIssuer?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AssetBadge({
  balance,
  showIssuer = true,
  size = "md",
  className,
}: AssetBadgeProps) {
  const isLpShares = balance.assetType === "liquidity_pool_shares";
  const code = isLpShares
    ? "LP"
    : balance.assetType === "native"
      ? "XLM"
      : (balance.assetCode ?? balance.asset);
  const { bg, text } = isLpShares
    ? { bg: "bg-surface-2", text: "text-ink-2" }
    : getAssetColor(code);

  const iconSize =
    size === "sm"
      ? "w-6 h-6 text-[9px]"
      : size === "lg"
        ? "w-10 h-10 text-[13px]"
        : "w-8 h-8 text-[11px]";
  const labelSize =
    size === "sm"
      ? "text-[11px]"
      : size === "lg"
        ? "text-[14px]"
        : "text-[13px]";
  const subSize = size === "sm" ? "text-[10px]" : "text-[11px]";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-bold shrink-0",
          iconSize,
          bg,
          text,
        )}
      >
        {code.slice(0, 2)}
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className={cn("font-medium text-ink leading-none", labelSize)}>
          {code}
        </span>
        {showIssuer &&
          (balance.assetType === "native" ? (
            <span className={cn("text-ink-3", subSize)}>Stellar Lumens</span>
          ) : isLpShares ? (
            <span className={cn("text-ink-3", subSize)}>
              Liquidity Pool Shares
            </span>
          ) : balance.assetIssuer ? (
            <span data-address className={subSize}>
              {truncateAddress(balance.assetIssuer, 6, 4)}
            </span>
          ) : null)}
      </div>
    </div>
  );
}

/** Inline pill version — just the code with colored dot */
export function AssetPill({
  assetCode,
  className,
}: {
  assetCode: string;
  className?: string;
}) {
  const { bg, text } = getAssetColor(assetCode);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border border-line-2",
        bg,
        text,
        className,
      )}
    >
      {assetCode}
    </span>
  );
}
