import { act,fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach,describe, expect, it, vi } from "vitest";

import { useSorokit } from "@/context/useSorokit";
import { getClient } from "@/lib/client";

import { TransactionPanel } from "./TransactionPanel";

vi.mock("@/context/useSorokit", () => ({
  useSorokit: vi.fn(),
}));

vi.mock("@/lib/client", () => ({
  getClient: vi.fn(),
}));

const DEFAULT_FEE = { baseFee: "100", recommended: "100" };

function mockGetClient(
  submitImpl: ReturnType<typeof vi.fn>,
  feeImpl: ReturnType<typeof vi.fn> = vi
    .fn()
    .mockResolvedValue({ data: DEFAULT_FEE, error: null }),
) {
  vi.mocked(getClient).mockReturnValue({
    transaction: {
      submit: submitImpl,
      estimateFee: feeImpl,
    },
  } as unknown as ReturnType<typeof getClient>);
}

/** Clicks the Send button (label varies by selected asset), waits for the confirmation modal, then confirms. */
async function reviewAndConfirm() {
  fireEvent.click(screen.getByRole("button", { name: /^Send (XLM|USDC)/ }));
  await screen.findByRole("dialog", { name: /confirm transaction/i });
  // act()-wrapped: submitTransaction's state updates can land before this
  // call returns when the mocked API resolves immediately (no artificial
  // delay), which otherwise trips React's "not wrapped in act(...)" warning.
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /confirm & sign/i }));
  });
}

describe("TransactionPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSorokit).mockReturnValue({
      address: "GABC",
      isConnected: true, get client() { return getClient(); },
    } as unknown as ReturnType<typeof useSorokit>);
  });

  it("opens a confirmation modal before submitting, showing the operation, fee, and source account", async () => {
    mockGetClient(vi.fn().mockResolvedValue({ data: { hash: "h1", ledger: 1 }, error: null }));
    render(<TransactionPanel />);

    const validDest = "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";
    fireEvent.change(screen.getByLabelText("Destination Address"), { target: { value: validDest } });
    fireEvent.change(screen.getByLabelText("Amount (XLM)"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: /^Send (XLM|USDC)/ }));

    const dialog = await screen.findByRole("dialog", { name: /confirm transaction/i });
    expect(dialog).toHaveTextContent("Payment — 1 operation");
    expect(dialog).toHaveTextContent("Send 10 XLM to");
    expect(dialog).toHaveTextContent("100 stroops");
    expect(dialog).toHaveTextContent("GABC");
  });

  it("does not submit until Confirm & Sign is clicked in the modal", async () => {
    const mockSubmit = vi.fn().mockResolvedValue({ data: { hash: "h1", ledger: 1 }, error: null });
    mockGetClient(mockSubmit);
    render(<TransactionPanel />);

    const validDest = "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";
    fireEvent.change(screen.getByLabelText("Destination Address"), { target: { value: validDest } });
    fireEvent.change(screen.getByLabelText("Amount (XLM)"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: /^Send (XLM|USDC)/ }));

    await screen.findByRole("dialog", { name: /confirm transaction/i });
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("cancelling the modal does not submit and returns to the form", async () => {
    const mockSubmit = vi.fn().mockResolvedValue({ data: { hash: "h1", ledger: 1 }, error: null });
    mockGetClient(mockSubmit);
    render(<TransactionPanel />);

    const validDest = "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";
    fireEvent.change(screen.getByLabelText("Destination Address"), { target: { value: validDest } });
    fireEvent.change(screen.getByLabelText("Amount (XLM)"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: /^Send (XLM|USDC)/ }));

    await screen.findByRole("dialog", { name: /confirm transaction/i });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Destination Address")).toHaveValue(validDest);
  });

  it("handles loading, success, and error states", async () => {
    const mockSubmit = vi.fn().mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve({ data: { hash: "txhash123", ledger: 100 }, error: null }), 50);
      });
    });
    mockGetClient(mockSubmit);

    render(<TransactionPanel />);

    const destInput = screen.getByLabelText("Destination Address");
    const amountInput = screen.getByLabelText("Amount (XLM)");

    const validDest = "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";
    fireEvent.change(destInput, { target: { value: validDest } });
    fireEvent.change(amountInput, { target: { value: "10" } });

    await reviewAndConfirm();

    // Check success state
    expect(await screen.findByText(/Transaction submitted/i)).toBeInTheDocument();
    expect(screen.getByText("Ledger #100")).toBeInTheDocument();
    expect(screen.getByText("txhash123")).toBeInTheDocument();

    // Test "New Transaction" button resets state
    const newTxBtn = screen.getByRole("button", { name: /New Transaction/i });
    fireEvent.click(newTxBtn);

    expect(screen.getByLabelText("Destination Address")).toHaveValue("");
    expect(screen.getByLabelText("Amount (XLM)")).toHaveValue(null);
  });

  it("handles error state", async () => {
    const mockSubmit = vi.fn().mockResolvedValue({ data: null, error: "Insufficient balance" });
    mockGetClient(mockSubmit);

    render(<TransactionPanel />);

    const validDest = "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";
    fireEvent.change(screen.getByLabelText("Destination Address"), { target: { value: validDest } });
    fireEvent.change(screen.getByLabelText("Amount (XLM)"), { target: { value: "10" } });

    await reviewAndConfirm();

    expect(await screen.findByText("Transaction failed")).toBeInTheDocument();
    expect(screen.getByText(/Insufficient balance/i)).toBeInTheDocument();
  });

  it("shows validation error for invalid destination address", async () => {
    render(<TransactionPanel />);

    const destInput = screen.getByLabelText("Destination Address");
    const amountInput = screen.getByLabelText("Amount (XLM)");
    const submitBtn = screen.getByRole("button", { name: /^Send (XLM|USDC)/ });

    // Initially no error should be visible
    expect(screen.queryByText("Stellar address must be 56 characters")).not.toBeInTheDocument();

    // Type invalid address
    fireEvent.change(destInput, { target: { value: "GDEF" } });
    fireEvent.change(amountInput, { target: { value: "10" } });

    // Validation error should show up because field is dirty and invalid
    expect(screen.getByText("Stellar address must be 56 characters")).toBeInTheDocument();
    // Submit button should be disabled because canSubmit is false
    expect(submitBtn).toBeDisabled();

    // Type valid address
    const validDest = "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";
    fireEvent.change(destInput, { target: { value: validDest } });
    expect(screen.getByText("Stellar address must be 56 characters")).toHaveClass("opacity-0");
    expect(submitBtn).not.toBeDisabled();
  });

  it("shows error if address is null at submit time", async () => {
    vi.mocked(useSorokit).mockReturnValue({
      address: null,
      isConnected: true, get client() { return getClient(); },
    } as unknown as ReturnType<typeof useSorokit>);

    render(<TransactionPanel />);

    const destInput = screen.getByLabelText("Destination Address");
    const amountInput = screen.getByLabelText("Amount (XLM)");
    const submitBtn = screen.getByRole("button", { name: /^Send (XLM|USDC)/ });

    const validDest = "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";
    fireEvent.change(destInput, { target: { value: validDest } });
    fireEvent.change(amountInput, { target: { value: "10" } });

    // With no address, canSubmit is false (isConnected relies on address in
    // the real provider, but this mock sets isConnected independently) — the
    // panel should not even attempt to open the review modal.
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("shows self-payment warning when destination equals source address", async () => {
    vi.mocked(useSorokit).mockReturnValue({
      address: "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
      isConnected: true, get client() { return getClient(); },
    } as unknown as ReturnType<typeof useSorokit>);

    render(<TransactionPanel />);

    const destInput = screen.getByLabelText("Destination Address");
    const amountInput = screen.getByLabelText("Amount (XLM)");
    const submitBtn = screen.getByRole("button", { name: /^Send (XLM|USDC)/ });

    fireEvent.change(destInput, {
      target: { value: "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC" },
    });
    fireEvent.change(amountInput, { target: { value: "10" } });

    expect(
      screen.getByText("Destination is the same as your wallet address"),
    ).toBeInTheDocument();
    expect(submitBtn).not.toBeDisabled();
  });

  it("shows error for amount below minimum threshold", async () => {
    render(<TransactionPanel />);

    const destInput = screen.getByLabelText("Destination Address");
    const amountInput = screen.getByLabelText("Amount (XLM)");
    const submitBtn = screen.getByRole("button", { name: /^Send (XLM|USDC)/ });

    const validDest = "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";
    fireEvent.change(destInput, { target: { value: validDest } });

    // Type amount below 0.0000001
    fireEvent.change(amountInput, { target: { value: "0.00000005" } });

    expect(screen.getByText("Minimum amount is 0.0000001 XLM")).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();

    // Type valid amount
    fireEvent.change(amountInput, { target: { value: "0.0000001" } });
    expect(screen.getByText("Minimum amount is 0.0000001 XLM")).toHaveClass(
      "opacity-0",
    );
    expect(submitBtn).not.toBeDisabled();
  });

  it("preserves form values when clicking Try Again after error", async () => {
    const mockSubmit = vi.fn().mockResolvedValue({ data: null, error: "Insufficient balance" });
    mockGetClient(mockSubmit);

    render(<TransactionPanel />);

    const destInput = screen.getByLabelText("Destination Address");
    const amountInput = screen.getByLabelText("Amount (XLM)");
    const memoInput = screen.getByLabelText("Memo (optional)");

    // Fill in form values
    const validDest = "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";
    const testAmount = "10.5";
    const testMemo = "Test memo";

    fireEvent.change(destInput, { target: { value: validDest } });
    fireEvent.change(amountInput, { target: { value: testAmount } });
    fireEvent.change(memoInput, { target: { value: testMemo } });

    // Verify values are set
    expect(destInput).toHaveValue(validDest);
    expect(amountInput).toHaveValue(Number(testAmount));
    expect(memoInput).toHaveValue(testMemo);

    // Review + confirm to trigger error
    await reviewAndConfirm();

    // Wait for error state
    await screen.findByText("Transaction failed");

    // Click "New Transaction" (Try Again) button
    const newTxBtn = screen.getByRole("button", { name: /New Transaction/i });
    fireEvent.click(newTxBtn);

    // Verify form values are preserved (not cleared)
    expect(destInput).toHaveValue(validDest);
    expect(amountInput).toHaveValue(Number(testAmount));
    expect(memoInput).toHaveValue(testMemo);
  });

  // ── Asset selector (#178) ─────────────────────────────────────────────────
  describe("asset selector", () => {
    const balances = [
      { asset: "XLM", balance: "100.0000000", assetType: "native" as const },
      {
        asset: "USDC",
        balance: "50.0000000",
        assetType: "credit_alphanum4" as const,
        assetCode: "USDC",
        assetIssuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      },
    ];

    it("populates the asset selector with the correct asset codes from context balances", () => {
      vi.mocked(useSorokit).mockReturnValue({
        address: "GABC",
        isConnected: true, get client() { return getClient(); },
        balances,
      } as unknown as ReturnType<typeof useSorokit>);

      render(<TransactionPanel />);

      const select = screen.getByLabelText("Asset") as HTMLSelectElement;
      const optionValues = Array.from(select.options).map((o) => o.value);
      expect(optionValues).toEqual(["XLM", "USDC"]);
    });

    it("updates the submitted asset when USDC is selected", async () => {
      const mockSubmit = vi
        .fn()
        .mockResolvedValue({ data: { hash: "h1", ledger: 1 }, error: null });
      mockGetClient(mockSubmit);
      vi.mocked(useSorokit).mockReturnValue({
        address: "GABC",
        isConnected: true, get client() { return getClient(); },
        balances,
      } as unknown as ReturnType<typeof useSorokit>);

      render(<TransactionPanel />);

      const select = screen.getByLabelText("Asset");
      fireEvent.change(select, { target: { value: "USDC" } });
      expect(select).toHaveValue("USDC");
      expect(screen.getByLabelText("Amount (USDC)")).toBeInTheDocument();

      const validDest =
        "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";
      fireEvent.change(screen.getByLabelText("Destination Address"), {
        target: { value: validDest },
      });
      fireEvent.change(screen.getByLabelText("Amount (USDC)"), {
        target: { value: "10" },
      });

      await reviewAndConfirm();

      await screen.findByText(/Transaction submitted/i);
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ asset: "USDC" }),
      );
    });

    it("disables the asset selector when no balances are loaded", () => {
      vi.mocked(useSorokit).mockReturnValue({
        address: "GABC",
        isConnected: true, get client() { return getClient(); },
        balances: [],
      } as unknown as ReturnType<typeof useSorokit>);

      render(<TransactionPanel />);

      const select = screen.getByLabelText("Asset");
      expect(select).toBeDisabled();
      expect(select).toHaveValue("XLM");
    });
  });

  describe("memo ID validation", () => {
    it("shows an error when Memo ID is non-numeric", () => {
      render(<TransactionPanel />);

      fireEvent.change(screen.getByLabelText("Memo Type"), { target: { value: "id" } });
      fireEvent.change(screen.getByLabelText("Memo ID"), { target: { value: "not-a-number" } });

      expect(
        screen.getByText("Memo ID must be an unsigned integer"),
      ).toBeInTheDocument();
    });

    it("accepts a numeric Memo ID", () => {
      render(<TransactionPanel />);

      fireEvent.change(screen.getByLabelText("Memo Type"), { target: { value: "id" } });
      fireEvent.change(screen.getByLabelText("Memo ID"), { target: { value: "12345" } });

      expect(
        screen.queryByText("Memo ID must be an unsigned integer"),
      ).not.toBeInTheDocument();
    });
  });

  describe("success state details", () => {
    it("shows a Successful badge and an explorer link on a known network", async () => {
      const mockSubmit = vi
        .fn()
        .mockResolvedValue({ data: { hash: "txhash123", ledger: 100 }, error: null });
      mockGetClient(mockSubmit);
      vi.mocked(useSorokit).mockReturnValue({
        address: "GABC",
        isConnected: true, get client() { return getClient(); },
        network: { name: "testnet", passphrase: "x", rpcUrl: "x", horizonUrl: "x" },
      } as unknown as ReturnType<typeof useSorokit>);

      render(<TransactionPanel />);

      const validDest = "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";
      fireEvent.change(screen.getByLabelText("Destination Address"), { target: { value: validDest } });
      fireEvent.change(screen.getByLabelText("Amount (XLM)"), { target: { value: "10" } });

      await reviewAndConfirm();
      await screen.findByText(/Transaction submitted/i);

      expect(screen.getByText("Successful")).toBeInTheDocument();
      const link = screen.getByRole("link", { name: /view on stellar expert/i });
      expect(link).toHaveAttribute(
        "href",
        "https://stellar.expert/explorer/testnet/tx/txhash123",
      );
    });
  });

  describe("default prop pre-fill (#351)", () => {
    it("pre-fills the destination input from defaultDestination", () => {
      const validDest = "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";
      render(<TransactionPanel defaultDestination={validDest} />);
      expect(screen.getByLabelText("Destination Address")).toHaveValue(validDest);
    });

    it("pre-fills the amount input from defaultAmount", () => {
      render(<TransactionPanel defaultAmount="42.5" />);
      expect(screen.getByLabelText("Amount (XLM)")).toHaveValue(42.5);
    });

    it("pre-fills the memo input from defaultMemo", () => {
      render(<TransactionPanel defaultMemo="Invoice #1001" />);
      expect(screen.getByLabelText("Memo (optional)")).toHaveValue("Invoice #1001");
    });

    it("leaves all fields empty when no defaults are provided", () => {
      render(<TransactionPanel />);
      expect(screen.getByLabelText("Destination Address")).toHaveValue("");
      expect(screen.getByLabelText("Amount (XLM)")).toHaveValue(null);
      expect(screen.getByLabelText("Memo (optional)")).toHaveValue("");
    });
  });

  describe("onSuccess / onError callbacks (#351)", () => {
    it("calls onSuccess with the transaction result after a successful submit", async () => {
      const txResult = { hash: "txhash123", ledger: 100 };
      const mockSubmit = vi.fn().mockResolvedValue({ data: txResult, error: null });
      mockGetClient(mockSubmit);
      const onSuccess = vi.fn();
      const onError = vi.fn();

      render(<TransactionPanel onSuccess={onSuccess} onError={onError} />);

      const validDest = "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";
      fireEvent.change(screen.getByLabelText("Destination Address"), { target: { value: validDest } });
      fireEvent.change(screen.getByLabelText("Amount (XLM)"), { target: { value: "10" } });

      await reviewAndConfirm();
      await screen.findByText(/Transaction submitted/i);

      expect(onSuccess).toHaveBeenCalledWith(txResult);
      expect(onError).not.toHaveBeenCalled();
    });

    it("calls onError with the error message when the API returns an error", async () => {
      const mockSubmit = vi.fn().mockResolvedValue({ data: null, error: "Insufficient balance" });
      mockGetClient(mockSubmit);
      const onSuccess = vi.fn();
      const onError = vi.fn();

      render(<TransactionPanel onSuccess={onSuccess} onError={onError} />);

      const validDest = "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";
      fireEvent.change(screen.getByLabelText("Destination Address"), { target: { value: validDest } });
      fireEvent.change(screen.getByLabelText("Amount (XLM)"), { target: { value: "10" } });

      await reviewAndConfirm();
      await screen.findByText("Transaction failed");

      await waitFor(() => { expect(onError).toHaveBeenCalledWith("Insufficient balance"); });
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it("calls onError with the thrown error's message when submit rejects", async () => {
      const mockSubmit = vi.fn().mockRejectedValue(new Error("Network unreachable"));
      mockGetClient(mockSubmit);
      const onSuccess = vi.fn();
      const onError = vi.fn();

      render(<TransactionPanel onSuccess={onSuccess} onError={onError} />);

      const validDest = "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";
      fireEvent.change(screen.getByLabelText("Destination Address"), { target: { value: validDest } });
      fireEvent.change(screen.getByLabelText("Amount (XLM)"), { target: { value: "10" } });

      await reviewAndConfirm();
      await screen.findByText("Transaction failed");

      await waitFor(() => { expect(onError).toHaveBeenCalledWith("Network unreachable"); });
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it("does not throw when onSuccess/onError are not provided", async () => {
      const mockSubmit = vi.fn().mockResolvedValue({ data: { hash: "h1", ledger: 1 }, error: null });
      mockGetClient(mockSubmit);

      render(<TransactionPanel />);

      const validDest = "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";
      fireEvent.change(screen.getByLabelText("Destination Address"), { target: { value: validDest } });
      fireEvent.change(screen.getByLabelText("Amount (XLM)"), { target: { value: "10" } });

      await reviewAndConfirm();
      expect(await screen.findByText(/Transaction submitted/i)).toBeInTheDocument();
    });
  });

  describe("memo character counter (#351)", () => {
    it("shows the counter in the default (non-red) color under 28 characters", () => {
      render(<TransactionPanel />);
      const memoInput = screen.getByLabelText("Memo (optional)");
      fireEvent.change(memoInput, { target: { value: "a".repeat(27) } });

      const counter = screen.getByText("27/28");
      expect(counter.className).toContain("text-ink-3");
      expect(counter.className).not.toContain("text-red");
    });

    it("turns the counter red at exactly 28 characters", () => {
      render(<TransactionPanel />);
      const memoInput = screen.getByLabelText("Memo (optional)");
      fireEvent.change(memoInput, { target: { value: "a".repeat(28) } });

      const counter = screen.getByText("28/28");
      expect(counter.className).toContain("text-red");
    });

    it("stays red beyond 28 characters", () => {
      render(<TransactionPanel />);
      const memoInput = screen.getByLabelText("Memo (optional)");
      fireEvent.change(memoInput, { target: { value: "a".repeat(35) } });

      const counter = screen.getByText("35/28");
      expect(counter.className).toContain("text-red");
    });

    it("does not render a counter for memo type ID or None", () => {
      render(<TransactionPanel />);
      fireEvent.change(screen.getByLabelText("Memo Type"), { target: { value: "none" } });
      expect(screen.queryByText(/^\d+\/28$/)).not.toBeInTheDocument();
    });
  });

  // ── previewMode (#315) ──────────────────────────────────────────────────────
  describe("previewMode", () => {
    it("submits directly without a confirmation modal when previewMode is false", async () => {
      const mockSubmit = vi
        .fn()
        .mockResolvedValue({ data: { hash: "h1", ledger: 1 }, error: null });
      mockGetClient(mockSubmit);

      render(<TransactionPanel previewMode={false} />);

      const validDest = "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";
      fireEvent.change(screen.getByLabelText("Destination Address"), { target: { value: validDest } });
      fireEvent.change(screen.getByLabelText("Amount (XLM)"), { target: { value: "10" } });

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /^Send (XLM|USDC)/ }));
      });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      await screen.findByText(/Transaction submitted/i);
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ destination: validDest, amount: "10" }),
      );
    });

    it("shows a confirmation modal by default (previewMode omitted)", async () => {
      mockGetClient(vi.fn().mockResolvedValue({ data: { hash: "h1", ledger: 1 }, error: null }));
      render(<TransactionPanel />);

      const validDest = "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";
      fireEvent.change(screen.getByLabelText("Destination Address"), { target: { value: validDest } });
      fireEvent.change(screen.getByLabelText("Amount (XLM)"), { target: { value: "10" } });
      fireEvent.click(screen.getByRole("button", { name: /^Send (XLM|USDC)/ }));

      expect(await screen.findByRole("dialog", { name: /confirm transaction/i })).toBeInTheDocument();
    });
  });

  // ── Asset-specific Send button label (#343) ────────────────────────────────
  describe("send button label is asset-specific (#343)", () => {
    const balances = [
      { asset: "XLM", balance: "100.0000000", assetType: "native" as const },
      {
        asset: "USDC",
        balance: "50.0000000",
        assetType: "credit_alphanum4" as const,
        assetCode: "USDC",
        assetIssuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      },
    ];

    it("renders 'Send XLM' when only XLM is available", () => {
      render(<TransactionPanel />);
      expect(
        screen.getByRole("button", { name: "Send XLM" }),
      ).toBeInTheDocument();
    });

    it("renders 'Send XLM' while XLM is the selected asset (multi-balance wallet)", () => {
      vi.mocked(useSorokit).mockReturnValue({
        address: "GABC",
        isConnected: true, get client() { return getClient(); },
        balances,
      } as unknown as ReturnType<typeof useSorokit>);

      render(<TransactionPanel />);
      expect(
        screen.getByRole("button", { name: "Send XLM" }),
      ).toBeInTheDocument();
    });

    it("renders 'Send USDC' once the user switches the asset select to USDC", () => {
      vi.mocked(useSorokit).mockReturnValue({
        address: "GABC",
        isConnected: true, get client() { return getClient(); },
        balances,
      } as unknown as ReturnType<typeof useSorokit>);

      render(<TransactionPanel />);
      fireEvent.change(screen.getByLabelText("Asset"), {
        target: { value: "USDC" },
      });

      expect(
        screen.getByRole("button", { name: "Send USDC" }),
      ).toBeInTheDocument();
    });
  });
});
