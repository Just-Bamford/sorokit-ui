import { useSorokit } from "@/context/useSorokit";
import { cn, truncateAddress } from "@/lib/utils";

interface WalletStatusBadgeProps {
  className?: string;
  /** Called when the badge is clicked while connected */
  onOpen?: () => void;
}

export function WalletStatusBadge({
  className,
  onOpen,
}: WalletStatusBadgeProps) {
  const { address, walletName, isConnected, isConnecting } = useSorokit();

  if (isConnecting) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 h-8 px-3 rounded-lg bg-surface-2 border border-line",
          className,
        )}
        role="status"
        aria-label="Connecting wallet"
      >
        <span
          aria-hidden="true"
          className="w-2 h-2 rounded-full bg-orange animate-pulse shrink-0"
        />
        <span className="text-[12px] text-ink-3">Connecting…</span>
      </div>
    );
  }

  if (!isConnected || !address) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 h-8 px-3 rounded-lg bg-surface-2 border border-line",
          className,
        )}
        aria-label="Wallet disconnected"
      >
        <span
          aria-hidden="true"
          className="w-2 h-2 rounded-full bg-ink-4 shrink-0"
        />
        <span className="text-[12px] text-ink-3">Disconnected</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "inline-flex items-center gap-2 h-8 px-3 rounded-lg bg-surface-2 border border-line hover:border-line-2 transition-colors cursor-pointer",
        className,
      )}
      aria-label={`Wallet connected: ${walletName ?? "Unknown"}, ${address}. Click to manage.`}
    >
      <span
        aria-hidden="true"
        className="w-2 h-2 rounded-full bg-green shrink-0"
      />
      <span className="text-[12px] font-medium text-ink">
        {walletName ?? "Wallet"}
      </span>
      <span className="text-[12px] text-ink-3 font-mono hidden sm:inline">
        {truncateAddress(address)}
      </span>
    </button>
  );
}
