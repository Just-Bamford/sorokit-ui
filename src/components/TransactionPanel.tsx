import {
  AlertCircleIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useId, useRef, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSorokit } from "@/context/useSorokit";
import { type NetworkInfo, type TxResult } from "@/lib/client";
import { cn, truncateAddress, validateStellarAddress } from "@/lib/utils";

import {
  TransactionConfirmModal,
  type TransactionPreviewData,
} from "./TransactionConfirmModal";
import { TransactionStatusTracker } from "./TransactionStatusTracker";

type State = "idle" | "loading" | "success" | "error";

type MemoType = "none" | "text" | "id";

const MEMO_TYPES: { value: MemoType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "id", label: "ID" },
  { value: "none", label: "None" },
];

/**
 * Maps a Stellar network to its Stellar Expert explorer URL segment.
 * Returns `null` for networks Stellar Expert does not index (e.g. futurenet,
 * localnet), in which case the hash is shown as plain text.
 */
function explorerTxUrl(
  network: NetworkInfo | null,
  hash: string,
): string | null {
  if (!network) return null;
  const segment =
    network.name === "mainnet"
      ? "public"
      : network.name === "testnet"
        ? "testnet"
        : null;
  if (!segment) return null;
  return `https://stellar.expert/explorer/${segment}/tx/${hash}`;
}

export interface TransactionPanelProps {
  defaultDestination?: string;
  defaultAmount?: string;
  defaultMemo?: string;
  onSuccess?: (result: TxResult) => void;
  onError?: (error: string) => void;
  /**
   * When true (the default), the footer button opens a confirmation modal
   * showing transaction details before `submitTransaction` runs. Pass
   * `false` to submit immediately on click, skipping the preview step.
   */
  previewMode?: boolean;
}

export function TransactionPanel({
  defaultDestination = "",
  defaultAmount = "",
  defaultMemo = "",
  onSuccess,
  onError,
  previewMode = true,
}: TransactionPanelProps = {}) {
  const { address, isConnected, balances, isLoadingAccount, network, account, client } = useSorokit();
  const [dest, setDest] = useState(defaultDestination);
  const [destDirty, setDestDirty] = useState(false);
  const [amount, setAmount] = useState(defaultAmount);
  const [amountDirty, setAmountDirty] = useState(false);
  const [asset, setAsset] = useState("XLM");
  const [memoType, setMemoType] = useState<MemoType>("text");
  const [memo, setMemo] = useState(defaultMemo);
  const [state, setState] = useState<State>("idle");
  const [result, setResult] = useState<TxResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<TransactionPreviewData | null>(null);
  const [isBuildingPreview, setIsBuildingPreview] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const formId = useId();

  const assetOptions = balances ?? [];

  // Derive the effective asset: keep the user's selection while it is valid,
  // otherwise fall back to the first available balance once balances load.
  const selectedAsset =
    assetOptions.length === 0 || assetOptions.some((b) => b.asset === asset)
      ? asset
      : assetOptions[0].asset;

  const isDestValid = validateStellarAddress(dest);
  const isSelfPayment = dest.trim() === address;
  const parsedAmount = parseFloat(amount);
  const isAmountValid = !isNaN(parsedAmount) && parsedAmount >= 0.0000001;
  const isMemoIdValid =
    memoType !== "id" || (memo.trim() !== "" && /^\d+$/.test(memo.trim()));

  // Check 7-decimal precision limit
  const decimalPlaces = amount.includes(".") ? amount.split(".")[1]?.length ?? 0 : 0;
  const isDecimalPrecisionValid = decimalPlaces <= 7;

  // Check if user has sufficient balance for the selected asset. XLM must
  // keep a 1 XLM minimum reserve, so only that much is spendable.
  const selectedAssetBalance = assetOptions.find((b) => b.asset === selectedAsset);
  const XLM_MINIMUM_RESERVE = 1;
  const availableBalance = selectedAssetBalance
    ? selectedAsset === "XLM"
      ? Math.max(0, parseFloat(selectedAssetBalance.balance) - XLM_MINIMUM_RESERVE)
      : parseFloat(selectedAssetBalance.balance)
    : undefined;
  const insufficientBalance =
    availableBalance !== undefined && parsedAmount > availableBalance;

  const canSubmit =
    isConnected &&
    isDestValid &&
    amount.trim() !== "" &&
    isAmountValid &&
    isMemoIdValid &&
    isDecimalPrecisionValid &&
    !insufficientBalance;

  /** The actual submission — only ever called from the confirm modal. */
  async function submitTransaction() {
    if (state === "loading") return;
    if (!address || !client) {
      setError("Wallet not connected");
      setState("error");
      return;
    }

    // Cancel previous requests
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setState("loading");
    setError(null);
    setResult(null);
    try {
      const { data, error: err } = await client.transaction.submit({
        source: address,
        destination: dest.trim(),
        amount: amount.trim(),
        asset: selectedAsset,
        memoType,
        memo:
          memoType !== "none" && memo.trim() !== "" ? memo.trim() : undefined,
      });
      if (signal.aborted) return;
      if (err) {
        setError(err);
        setState("error");
        onError?.(err);
        return;
      }
      setResult(data);
      setState("success");
      onSuccess?.(data!);
      setDest("");
      setAmount("");
      setMemo("");
      setDestDirty(false);
      setAmountDirty(false);
    } catch (e) {
      if (!signal.aborted) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        setError(msg);
        setState("error");
        onError?.(msg);
      }
    } finally {
      setPreview(null);
    }
  }

  /** Builds a preview of the transaction and opens the confirmation modal. */
  async function buildPreview() {
    if (!address) return;
    setIsBuildingPreview(true);
    try {
      const { data: feeData } = client ? await client.transaction.estimateFee() : { data: null };
      const memoSuffix =
        memoType !== "none" && memo.trim() !== "" ? ` — memo: "${memo.trim()}"` : "";
      setPreview({
        transactionType: "Payment",
        operations: [
          {
            type: "Payment",
            description: `Send ${amount.trim()} ${selectedAsset} to ${truncateAddress(dest.trim(), 8, 6)}${memoSuffix}`,
          },
        ],
        fee: {
          baseFeeStroops: feeData?.baseFee ?? "100",
          totalStroops: feeData?.recommended ?? feeData?.baseFee ?? "100",
        },
        sourceAccount: address,
        sequenceNumber: account?.sequence,
      });
    } finally {
      setIsBuildingPreview(false);
    }
  }

  /** Form submit handler — fires on Send button click and Enter key press. */
  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading" || !address || !canSubmit) return;
    if (previewMode) {
      void buildPreview();
    } else {
      void submitTransaction();
    }
  }

  const explorerUrl = result ? explorerTxUrl(network, result.hash) : null;

  return (
    <div className="rounded-xl border border-line bg-surface overflow-hidden">
      <div className="px-5 py-4 border-b border-line">
        <h3 className="text-[14px] font-semibold text-ink">Send Payment</h3>
        <p className="text-[12px] text-ink-3 mt-0.5">
          Submit a payment on the Stellar network
        </p>
      </div>

      <div className="px-6 py-6">
        {!isConnected ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <p className="text-[13px] text-ink-3">
              Connect your wallet to send transactions
            </p>
          </div>
        ) : state === "success" && result ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-success-dim flex items-center justify-center shrink-0">
                <HugeiconsIcon
                  icon={CheckmarkCircle01Icon}
                  size={18}
                  color="currentColor"
                  strokeWidth={1.5}
                  className="text-green"
                />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-ink">
                  Transaction submitted
                </p>
                <p className="text-[12px] text-ink-3">
                  Ledger #{result.ledger}
                </p>
              </div>
            </div>
            <div className="rounded-lg bg-surface-2 border border-line px-5 py-4 flex flex-col gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-4">
                Transaction Hash
              </p>
              {explorerUrl ? (
                <a
                  data-txhash
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all leading-relaxed text-brand hover:underline inline-flex items-start gap-1.5"
                >
                  <span>{result.hash}</span>
                  <ExternalLinkIcon className="mt-[3px] shrink-0 opacity-70" />
                </a>
              ) : (
                <span data-testid="submitted-tx-hash" data-txhash className="break-all leading-relaxed">
                  {result.hash}
                </span>
              )}
              <div className="flex items-center gap-2">
                <Badge variant="success" dot>
                  Successful
                </Badge>
                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-brand hover:underline"
                  >
                    View on Stellar Expert
                  </a>
                )}
              </div>
            </div>
            <TransactionStatusTracker hash={result.hash} className="mt-2" />
          </div>
        ) : state === "error" ? (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-error-dim flex items-center justify-center shrink-0 mt-0.5">
              <HugeiconsIcon
                icon={AlertCircleIcon}
                size={18}
                color="currentColor"
                strokeWidth={1.5}
                className="text-red"
              />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-ink">
                Transaction failed
              </p>
              <p className="text-[13px] text-red mt-1">{error}</p>
            </div>
          </div>
        ) : (
          <form id={formId} onSubmit={handleFormSubmit} className="flex flex-col gap-5">
            <Input
              label="Destination Address"
              placeholder="G..."
              value={dest}
              onChange={(e) => {
                setDest(e.target.value);
                setDestDirty(true);
              }}
              error={
                destDirty
                  ? !isDestValid
                    ? !dest.trim().startsWith("G")
                      ? "Stellar address must start with 'G'"
                      : "Stellar address must be 56 characters"
                    : isSelfPayment
                      ? "Destination is the same as your wallet address"
                      : undefined
                  : undefined
              }
              disabled={state === "loading"}
            />
            <Select
              label="Asset"
              value={selectedAsset}
              onChange={(e) => setAsset(e.target.value)}
              disabled={state === "loading" || isLoadingAccount || assetOptions.length === 0}
            >
              {isLoadingAccount ? (
                <option value="">Loading assets…</option>
              ) : assetOptions.length === 0 ? (
                <option value="XLM">XLM</option>
              ) : (
                assetOptions.map((b) => (
                  <option key={b.asset} value={b.asset}>
                    {b.asset} — {b.balance}
                  </option>
                ))
              )}
            </Select>
            <Input
              label={`Amount (${selectedAsset})`}
              type="number"
              placeholder="0.00"
              min="0.0000001"
              step="0.0000001"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setAmountDirty(true);
              }}
              error={
                amountDirty
                  ? amount.trim() === ""
                    ? "Amount is required"
                    : isNaN(parsedAmount) || parsedAmount <= 0
                      ? "Amount must be greater than 0"
                      : parsedAmount < 0.0000001
                        ? "Minimum amount is 0.0000001 XLM"
                        : !isDecimalPrecisionValid
                          ? "Maximum 7 decimal places allowed"
                          : insufficientBalance
                            ? selectedAsset === "XLM"
                              ? `Amount exceeds available balance (${availableBalance?.toFixed(7) ?? "0"} XLM after minimum reserve)`
                              : `Insufficient balance. Maximum: ${selectedAssetBalance?.balance ?? "0"}`
                            : undefined
                  : undefined
              }
              disabled={state === "loading"}
            />
            <Select
              label="Memo Type"
              value={memoType}
              onChange={(e) => {
                setMemoType(e.target.value as MemoType);
                setMemo("");
              }}
              disabled={state === "loading"}
            >
              {MEMO_TYPES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
            {memoType !== "none" && (
              <div className="flex flex-col gap-1.5">
                <Input
                  label={memoType === "id" ? "Memo ID" : "Memo (optional)"}
                  placeholder={memoType === "id" ? "1234567890" : "Text memo"}
                  inputMode={memoType === "id" ? "numeric" : undefined}
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  error={
                    memoType === "id" && memo.trim() !== "" && !isMemoIdValid
                      ? "Memo ID must be an unsigned integer"
                      : undefined
                  }
                  disabled={state === "loading"}
                />
                {memoType === "text" && (
                  <span
                    className={`text-[10px] text-right ${memo.length >= 28 ? "text-red" : "text-ink-3"}`}
                  >
                    {memo.length}/28
                  </span>
                )}
              </div>
            )}
          </form>
        )}
      </div>

      <div className="px-5 py-4 border-t border-line flex items-center gap-3">
        {state === "success" || state === "error" ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setState("idle");
              setResult(null);
              setError(null);
              setDestDirty(false);
              setAmountDirty(false);
            }}
          >
            New Transaction
          </Button>
        ) : (
          <Button
            type="submit"
            form={formId}
            size="md"
            loading={state === "loading" || isBuildingPreview}
            disabled={!canSubmit}
          >
            {state === "loading"
              ? "Submitting…"
              : isBuildingPreview
                ? "Preparing…"
                : `Send ${selectedAsset}`}
          </Button>
        )}
      </div>

      <TransactionConfirmModal
        open={preview !== null}
        transaction={preview}
        isSigning={state === "loading"}
        onCancel={() => setPreview(null)}
        onConfirm={() => void submitTransaction()}
      />
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

function Select({ label, className, id, children, ...props }: SelectProps) {
  const generatedId = useId();
  const selectId =
    id ?? label?.toLowerCase().replace(/\s+/g, "-") ?? generatedId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-[12px] font-medium text-ink-2"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          "h-9 w-full rounded-lg border border-line bg-surface-2 px-3.5",
          "text-[13px] text-ink outline-none transition-colors",
          "focus:border-line-2 focus:ring-1 focus:ring-brand-dim",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 5h5v5" />
      <path d="M19 5l-8 8" />
      <path d="M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4" />
    </svg>
  );
}
