/**
 * TransactionConfirmModal
 *
 * A confirmation dialog shown before signing a transaction: transaction
 * type, operation summaries, a full fee breakdown (stroops and XLM), the
 * source account, sequence number, and timeout ledger. Requires an explicit
 * "Confirm & Sign" click before the caller's `onConfirm` runs.
 *
 * This component is presentation-only — it does not build or sign
 * transactions itself (see package.json's "Strictly presentation layer"
 * description). Callers construct a `TransactionPreviewData` from whatever
 * their sorokit-core client / transaction builder exposes and pass it in.
 *
 * @component
 * @example
 * ```tsx
 * import { TransactionConfirmModal } from 'sorokit-ui';
 *
 * function SendPayment() {
 *   const [preview, setPreview] = useState<TransactionPreviewData | null>(null);
 *   return (
 *     <TransactionConfirmModal
 *       open={preview !== null}
 *       transaction={preview}
 *       onCancel={() => setPreview(null)}
 *       onConfirm={async () => {
 *         await submit();
 *         setPreview(null);
 *       }}
 *     />
 *   );
 * }
 * ```
 */
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as Dialog from "@radix-ui/react-dialog";

import { Button } from "@/components/ui/Button";
import { formatXlm, STROOPS_PER_XLM } from "@/lib/staking";
import { truncateAddress } from "@/lib/utils";

export interface TransactionOperationSummary {
  /** Short operation type label, e.g. "Payment", "Change Trust" */
  type: string;
  /** Human-readable description, e.g. "Send 100 XLM to GABC…WXYZ" */
  description: string;
}

export interface TransactionFeeBreakdown {
  /** Stellar network base fee, in stroops */
  baseFeeStroops: string;
  /** Additional Soroban resource fee, in stroops, if applicable */
  networkFeeStroops?: string;
  /** Total fee that will be charged, in stroops */
  totalStroops: string;
}

export interface TransactionPreviewData {
  /** e.g. "Payment", "Path Payment", "Contract Invocation" */
  transactionType: string;
  operations: TransactionOperationSummary[];
  fee: TransactionFeeBreakdown;
  sourceAccount: string;
  /** Omitted when unavailable — shown as "Determined by wallet" */
  sequenceNumber?: string;
  /** Omitted when unavailable — shown as "Determined by wallet" */
  timeoutLedger?: number;
}

export interface TransactionConfirmModalProps {
  open: boolean;
  transaction: TransactionPreviewData | null;
  /** Called when the user clicks "Confirm & Sign" */
  onConfirm: () => void | Promise<void>;
  /** Called on Cancel, backdrop click, close button, or Escape */
  onCancel: () => void;
  /** Shows a loading state on the confirm button and disables both actions */
  isSigning?: boolean;
}

function stroopsToXlmLabel(stroops: string): string {
  const num = Number(stroops);
  if (!Number.isFinite(num)) return "—";
  return formatXlm(num / STROOPS_PER_XLM, 7);
}

export function TransactionConfirmModal({
  open,
  transaction,
  onConfirm,
  onCancel,
  isSigning = false,
}: TransactionConfirmModalProps) {
  return (
    <Dialog.Root
      open={open && transaction !== null}
      onOpenChange={(next) => {
        if (!next && !isSigning) onCancel();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 animate-in fade-in" />
        <Dialog.Content
          className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[85vh] flex flex-col rounded-xl border border-line bg-surface shadow-2xl focus:outline-none animate-in fade-in zoom-in-95"
          aria-describedby="tx-confirm-desc"
        >
          <div className="flex items-center justify-between px-6 pt-6 pb-1 shrink-0">
            <Dialog.Title className="text-[14px] font-semibold text-ink">
              Confirm transaction
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="text-ink-4 hover:text-ink-2 transition-colors"
                aria-label="Close"
                disabled={isSigning}
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={16}
                  color="currentColor"
                  strokeWidth={1.5}
                />
              </button>
            </Dialog.Close>
          </div>

          {transaction && (
            <>
              <p id="tx-confirm-desc" className="px-6 pb-4 text-[12px] text-ink-3">
                {transaction.transactionType} — {transaction.operations.length}{" "}
                operation{transaction.operations.length === 1 ? "" : "s"}
              </p>

              <div className="flex-1 overflow-y-auto px-6 flex flex-col gap-5 pb-1">
                <Section title="Operations">
                  <div className="flex flex-col gap-2">
                    {transaction.operations.map((op, i) => (
                      <div
                        key={`${op.type}-${i}`}
                        className="rounded-lg border border-line bg-surface-2 px-3 py-2.5"
                      >
                        <p className="text-[11px] font-semibold text-ink-2">
                          {i + 1}. {op.type}
                        </p>
                        <p className="text-[12px] text-ink mt-0.5 break-words">
                          {op.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Fee breakdown">
                  <div className="flex flex-col gap-2 text-[12px]">
                    <FeeRow
                      label="Base fee"
                      stroops={transaction.fee.baseFeeStroops}
                    />
                    {transaction.fee.networkFeeStroops !== undefined && (
                      <FeeRow
                        label="Network fee"
                        stroops={transaction.fee.networkFeeStroops}
                      />
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-line font-semibold">
                      <span className="text-ink-2">Total</span>
                      <span className="text-ink tabular-nums">
                        {transaction.fee.totalStroops} stroops (
                        {stroopsToXlmLabel(transaction.fee.totalStroops)})
                      </span>
                    </div>
                  </div>
                </Section>

                <Section title="Details">
                  <div className="flex flex-col gap-2 text-[12px]">
                    <DetailRow label="Source account">
                      <span
                        data-address
                        className="font-mono text-ink"
                        title={transaction.sourceAccount}
                      >
                        {truncateAddress(transaction.sourceAccount, 8, 6)}
                      </span>
                    </DetailRow>
                    <DetailRow label="Sequence number">
                      <span className="font-mono text-ink">
                        {transaction.sequenceNumber ?? "Determined by wallet"}
                      </span>
                    </DetailRow>
                    <DetailRow label="Timeout ledger">
                      <span className="font-mono text-ink">
                        {transaction.timeoutLedger ?? "Determined by wallet"}
                      </span>
                    </DetailRow>
                  </div>
                </Section>
              </div>
            </>
          )}

          <div className="flex gap-2 px-6 py-4 border-t border-line shrink-0">
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={onCancel}
              disabled={isSigning}
            >
              Cancel
            </Button>
            <Button
              size="md"
              className="flex-1"
              loading={isSigning}
              disabled={!transaction}
              onClick={() => void onConfirm()}
            >
              {isSigning ? "Signing…" : "Confirm & Sign"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-4 mb-2">
        {title}
      </p>
      {children}
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-3">{label}</span>
      {children}
    </div>
  );
}

function FeeRow({ label, stroops }: { label: string; stroops: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-3">{label}</span>
      <span className="text-ink tabular-nums">
        {stroops} stroops ({stroopsToXlmLabel(stroops)})
      </span>
    </div>
  );
}
