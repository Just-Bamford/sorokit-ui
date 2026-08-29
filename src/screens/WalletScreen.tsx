import { useEffect, useRef, useState } from "react";

import { AddressDisplay } from "@/components/AddressDisplay";
import { QRCode } from "@/components/QRCode";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { InfoCell } from "@/components/ui/InfoCell";
import { useSorokit } from "@/context/useSorokit";
import { truncateAddress } from "@/lib/utils";

export function WalletScreen() {
  const { address, isConnected, disconnectWallet, network } = useSorokit();
  const [isConfirming, setIsConfirming] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const handleDisconnect = () => {
    if (isConfirming) {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsConfirming(false);
      disconnectWallet();
    } else {
      setIsConfirming(true);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setIsConfirming(false);
      }, 3000);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!toastVisible) return;
    const id = window.setTimeout(() => setToastVisible(false), 3000);
    return () => window.clearTimeout(id);
  }, [toastVisible]);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-line bg-surface overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-line">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-brand-dim border-2 border-[rgba(86,69,212,0.25)] flex items-center justify-center text-[13px] font-bold text-brand shrink-0">
              {address ? address.slice(0, 2).toUpperCase() : "—"}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5">
                <span className="text-[15px] font-semibold text-ink">
                  {isConnected ? "Connected" : "Not connected"}
                </span>
                <Badge variant={isConnected ? "success" : "default"} dot>
                  {isConnected ? "Active" : "Inactive"}
                </Badge>
              </div>
              {address && (
                <span data-address>{truncateAddress(address, 14, 6)}</span>
              )}
            </div>
          </div>
          {isConnected && (
            <Button
              variant={isConfirming ? "destructive" : "secondary"}
              size="sm"
              onClick={handleDisconnect}
            >
              {isConfirming ? "Disconnect?" : "Disconnect"}
            </Button>
          )}
        </div>

        {/* Network info cells */}
        {network && (
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-line">
            <InfoCell label="Network" value={network.name} copyable />
            <InfoCell label="RPC Endpoint" value={network.rpcUrl} mono copyable />
          </div>
        )}
      </div>

      {isConnected && address && (
        <div className="rounded-xl border border-line bg-surface overflow-hidden">
          <div className="px-6 py-5 border-b border-line">
            <h3 className="text-[14px] font-semibold text-ink">Receive Funds</h3>
            <p className="text-[12px] text-ink-3 mt-0.5">
              Scan the QR code or copy the address to receive payments
            </p>
          </div>
          <div className="px-6 py-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <QRCode
              value={address}
              size={140}
              className="shrink-0"
              ariaLabel={`QR code to receive funds at address ${address}`}
            />
            <div className="flex-1 min-w-0 w-full flex flex-col justify-center gap-1 sm:h-[164px]">
              <AddressDisplay
                address={address}
                showFull
                label="Address"
                onCopy={() => setToastVisible(true)}
              />
            </div>
          </div>
        </div>
      )}

      {toastVisible && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 bg-surface border border-line rounded-md px-4 py-3 shadow-lg animate-in fade-in slide-in-from-bottom-2"
        >
          <p className="text-[13px] font-semibold text-ink">Address Copied</p>
          <p className="text-[12px] text-ink-3">
            The address has been copied to your clipboard.
          </p>
        </div>
      )}
    </div>
  );
}

