import { Cancel01Icon, Logout04Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { useSorokit } from "@/context/useSorokit";
import { truncateAddress } from "@/lib/utils";

import { WalletConnectModal } from "./WalletConnectModal";

export function WalletConnectButton({
  onOpenModal,
}: {
  /** Called when clicking the button while already connected (e.g. to open an account sidebar). */
  onOpenModal?: () => void;
}) {
  const { isConnected, isConnecting, address, error, clearError, disconnectWallet, isDisconnecting } = useSorokit();
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Once connected, this component stops rendering the connect modal at all
  // (see the early return below) — reset the open flag so a later
  // disconnect doesn't remount it already open.
  useEffect(() => {
    if (isConnected) {
      const timerId = window.setTimeout(() => setConnectModalOpen(false), 0);
      return () => window.clearTimeout(timerId);
    }
  }, [isConnected]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isConnected && address) {
    const handleClick = () => {
      if (onOpenModal) {
        onOpenModal();
      } else {
        setDropdownOpen((prev) => !prev);
      }
    };

    return (
      <div ref={containerRef} className="relative">
        <button
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 sm:gap-2 h-8 px-2 sm:px-3.5 rounded-lg bg-surface-2 border border-line hover:border-line-2 transition-colors cursor-pointer"
          aria-label={`Wallet connected: ${address}. Click to manage.`}
        >
          <span className="w-2 h-2 rounded-full bg-green shrink-0" />
          <span data-address className="hidden sm:inline">{truncateAddress(address)}</span>
        </button>
        {!onOpenModal && dropdownOpen && (
          <div className="absolute right-0 top-[calc(100%+4px)] z-50 min-w-[160px] rounded-lg bg-surface border border-line shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
            <button
              onClick={disconnectWallet}
              disabled={isDisconnecting}
              className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-red hover:bg-error-dim-muted transition-colors rounded-lg cursor-pointer disabled:opacity-50"
            >
              <HugeiconsIcon
                icon={Logout04Icon}
                size={14}
                color="currentColor"
                strokeWidth={2}
              />
              {isDisconnecting ? "Disconnecting…" : "Disconnect"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-end">
      <Button
        size="md"
        loading={isConnecting}
        onClick={() => setConnectModalOpen(true)}
        className="px-2.5 sm:px-4"
        aria-label={isConnecting ? "Connecting…" : "Connect Wallet"}
      >
        <span className="hidden sm:inline">{isConnecting ? "Connecting…" : "Connect Wallet"}</span>
        <span className="sm:hidden">{isConnecting ? "…" : "Connect"}</span>
      </Button>
      {!isConnected && error && !connectModalOpen && (
        <div className="absolute top-[calc(100%+8px)] right-0 z-50 flex items-center gap-2 px-3 py-1.5 bg-surface border border-error-dim rounded-lg shadow-lg text-red text-[11px] whitespace-nowrap animate-in fade-in slide-in-from-top-1 duration-200">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="text-red opacity-50 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center shrink-0"
            aria-label="Clear error"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={12}
              color="currentColor"
              strokeWidth={2}
            />
          </button>
        </div>
      )}
      <WalletConnectModal
        open={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
      />
    </div>
  );
}
