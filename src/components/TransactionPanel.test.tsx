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
const VALID_DEST = "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ";
const MOCK_SOURCE = "GBRPYHIL2CI3WHGSUJGY6O7SROQOMJG7QBCACN4QPKUOQNXJDGONXHPA";

function mockGetClient(
  submitImpl: ReturnType<typeof vi.fn>,
  feeImpl: ReturnType<typeof vi.fn> = vi
    .fn()
    .mockResolvedValue({ data: DEFAULT_FEE, error: null }),
) {
  const clientObj = {
    transaction: {
      submit: submitImpl,
      estimateFee: feeImpl,
    },
  } as unknown as ReturnType<typeof getClient>;
  vi.mocked(getClient).mockReturnValue(clientObj);
  vi.mocked(useSorokit).mockReturnValue({
    address: MOCK_SOURCE,
    client: clientObj,
    isConnected: true,
    balances: [{ asset: "XLM", balance: "100" }],
  } as unknown as ReturnType<typeof useSorokit>);
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
    mockGetClient(vi.fn().mockResolvedValue({ data: { hash: "h1", ledger: 1 }, error: null }));
  });

  it("opens a confirmation modal before submitting, showing the operation, fee, and source account", async () => {
    mockGetClient(vi.fn().mockResolvedValue({ data: { hash: "h1", ledger: 1 }, error: null }));
    render(<TransactionPanel />);

    fireEvent.change(screen.getByLabelText("Destination Address"), { target: { value: VALID_DEST } });
    fireEvent.change(screen.getByLabelText("Amount (XLM)"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: /^Send (XLM|USDC)/ }));

    const dialog = await screen.findByRole("dialog", { name: /confirm transaction/i });
    expect(dialog).toHaveTextContent("Payment — 1 operation");
    expect(dialog).toHaveTextContent("Send 10 XLM to");
    expect(dialog).toHaveTextContent("100 stroops");
    expect(dialog).toHaveTextContent("GBRPYHIL...ONXHPA");
  });

  it("does not submit until Confirm & Sign is clicked in the modal", async () => {
    const mockSubmit = vi.fn().mockResolvedValue({ data: { hash: "h1", ledger: 1 }, error: null });
    mockGetClient(mockSubmit);
    render(<TransactionPanel />);

    fireEvent.change(screen.getByLabelText("Destination Address"), { target: { value: VALID_DEST } });
    fireEvent.change(screen.getByLabelText("Amount (XLM)"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: /^Send (XLM|USDC)/ }));

    await screen.findByRole("dialog", { name: /confirm transaction/i });
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("cancelling the modal does not submit and returns to the form", async () => {
    const mockSubmit = vi.fn().mockResolvedValue({ data: { hash: "h1", ledger: 1 }, error: null });
    mockGetClient(mockSubmit);
    render(<TransactionPanel />);

    fireEvent.change(screen.getByLabelText("Destination Address"), { target: { value: VALID_DEST } });
    fireEvent.change(screen.getByLabelText("Amount (XLM)"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: /^Send (XLM|USDC)/ }));

    await screen.findByRole("dialog", { name: /confirm transaction/i });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Destination Address")).toHaveValue(VALID_DEST);
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

    fireEvent.change(destInput, { target: { value: VALID_DEST } });
    fireEvent.change(amountInput, { target: { value: "10" } });

    await reviewAndConfirm();

    // Check success state
    expect(await screen.findByText("Transaction submitted")).toBeInTheDocument();
    expect(screen.getByText("Ledger #100")).toBeInTheDocument();
    expect(screen.getByText("txhash123")).toBeInTheDocument();

    // Test "New Transaction" button resets state
    const newTxBtn = screen.getByRole("button", { name: "New Transaction" });
    fireEvent.click(newTxBtn);

    expect(screen.getByLabelText("Destination Address")).toHaveValue("");
    expect(screen.getByLabelText("Amount (XLM)")).toHaveValue(null);
  });

  it("handles error state", async () => {
    const mockSubmit = vi.fn().mockResolvedValue({ data: null, error: "Submission rejected by network" });
    mockGetClient(mockSubmit);

    render(<TransactionPanel />);

    fireEvent.change(screen.getByLabelText("Destination Address"), { target: { value: VALID_DEST } });
    fireEvent.change(screen.getByLabelText("Amount (XLM)"), { target: { value: "10" } });

    await reviewAndConfirm();

    expect(await screen.findByText("Transaction failed")).toBeInTheDocument();
    expect(screen.getByText("Submission rejected by network")).toBeInTheDocument();
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
    fireEvent.change(destInput, { target: { value: VALID_DEST } });
    expect(screen.getByText("Stellar address must be 56 characters")).toHaveClass("opacity-0");
    expect(submitBtn).not.toBeDisabled();
  });

  it("shows error if address is null at submit time", async () => {
    vi.mocked(useSorokit).mockReturnValue({
      address: null,
      isConnected: true,
      balances: [{ asset: "XLM", balance: "100" }],
    } as unknown as ReturnType<typeof useSorokit>);

    render(<TransactionPanel />);

    const destInput = screen.getByLabelText("Destination Address");
    const amountInput = screen.getByLabelText("Amount (XLM)");
    const submitBtn = screen.getByRole("button", { name: /^Send (XLM|USDC)/ });

    fireEvent.change(destInput, { target: { value: VALID_DEST } });
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
      address: VALID_DEST,
      isConnected: true,
      balances: [{ asset: "XLM", balance: "100" }],
    } as unknown as ReturnType<typeof useSorokit>);

    render(<TransactionPanel />);

    const destInput = screen.getByLabelText("Destination Address");
    const amountInput = screen.getByLabelText("Amount (XLM)");
    const submitBtn = screen.getByRole("button", { name: /^Send (XLM|USDC)/ });

    fireEvent.change(destInput, {
      target: { value: VALID_DEST },
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

    fireEvent.change(destInput, { target: { value: VALID_DEST } });

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

  it("shows insufficient balance error when amount exceeds XLM balance", async () => {
    vi.mocked(useSorokit).mockReturnValue({
      address: MOCK_SOURCE,
      isConnected: true,
      balances: [{ asset: "XLM", balance: "10" }],
    } as unknown as ReturnType<typeof useSorokit>);

    render(<TransactionPanel />);

    const destInput = screen.getByLabelText("Destination Address");
    const amountInput = screen.getByLabelText("Amount (XLM)");
    const submitBtn = screen.getByRole("button", { name: /^Send (XLM|USDC)/ });

    fireEvent.change(destInput, { target: { value: VALID_DEST } });

    // Type amount exceeding balance (10 XLM)
    fireEvent.change(amountInput, { target: { value: "15" } });

    expect(screen.getByText("Insufficient balance")).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();

    // Type amount within balance
    fireEvent.change(amountInput, { target: { value: "5" } });
    expect(screen.getByText("Insufficient balance")).toHaveClass("opacity-0");
    expect(submitBtn).not.toBeDisabled();
  });

  it("allows submission when amount is within XLM balance", async () => {
    const mockSubmit = vi.fn().mockResolvedValue({ data: { hash: "txhash123", ledger: 100 }, error: null });
    mockGetClient(mockSubmit);

    render(<TransactionPanel previewMode={false} />);

    const destInput = screen.getByLabelText("Destination Address");
    const amountInput = screen.getByLabelText("Amount (XLM)");
    const submitBtn = screen.getByRole("button", { name: /^Send (XLM|USDC)/ });

    fireEvent.change(destInput, { target: { value: VALID_DEST } });
    fireEvent.change(amountInput, { target: { value: "50" } });

    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    expect(await screen.findByText("Transaction submitted")).toBeInTheDocument();
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
        isConnected: true,
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
        isConnected: true,
        balances,
      } as unknown as ReturnType<typeof useSorokit>);

      render(<TransactionPanel />);

      const select = screen.getByLabelText("Asset");
      fireEvent.change(select, { target: { value: "USDC" } });
      expect(select).toHaveValue("USDC");
      expect(screen.getByLabelText("Amount (USDC)")).toBeInTheDocument();

      const validDest = VALID_DEST;
      fireEvent.change(screen.getByLabelText("Destination Address"), {
        target: { value: validDest },
      });
      fireEvent.change(screen.getByLabelText("Amount (USDC)"), {
        target: { value: "10" },
      });

      await reviewAndConfirm();

      await screen.findByText("Transaction submitted");
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ asset: "USDC" }),
      );
    });

    it("disables the asset selector when no balances are loaded", () => {
      vi.mocked(useSorokit).mockReturnValue({
        address: "GABC",
        isConnected: true,
        balances: [],
      } as unknown as ReturnType<typeof useSorokit>);

      render(<TransactionPanel />);

      const select = screen.getByLabelText("Asset");
      expect(select).toBeDisabled();
      expect(select).toHaveValue("XLM");
    });

    it("includes the asset's issuer in the submitted payload for a non-native asset (#565)", async () => {
      const mockSubmit = vi
        .fn()
        .mockResolvedValue({ data: { hash: "h1", ledger: 1 }, error: null });
      mockGetClient(mockSubmit);
      vi.mocked(useSorokit).mockReturnValue({
        address: "GABC",
        isConnected: true,
        balances,
        // getClient() here returns the object mockGetClient() just wired up
        // above; TransactionPanel reads `client` from context, not from a
        // direct getClient() call, so the mocked client has to be threaded
        // through explicitly for the submission to actually run.
        client: getClient(),
      } as unknown as ReturnType<typeof useSorokit>);

      render(<TransactionPanel />);

      fireEvent.change(screen.getByLabelText("Asset"), {
        target: { value: "USDC" },
      });
      const validDest = VALID_DEST;
      fireEvent.change(screen.getByLabelText("Destination Address"), {
        target: { value: validDest },
      });
      fireEvent.change(screen.getByLabelText("Amount (USDC)"), {
        target: { value: "10" },
      });

      await reviewAndConfirm();

      await screen.findByText("Transaction submitted");
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          asset: "USDC",
          assetIssuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        }),
      );
    });

    it("omits assetIssuer for the native XLM asset (#565)", async () => {
      const mockSubmit = vi
        .fn()
        .mockResolvedValue({ data: { hash: "h1", ledger: 1 }, error: null });
      mockGetClient(mockSubmit);
      vi.mocked(useSorokit).mockReturnValue({
        address: "GABC",
        isConnected: true,
        balances,
        client: getClient(),
      } as unknown as ReturnType<typeof useSorokit>);

      render(<TransactionPanel />);

      const validDest = VALID_DEST;
      fireEvent.change(screen.getByLabelText("Destination Address"), {
        target: { value: validDest },
      });
      fireEvent.change(screen.getByLabelText("Amount (XLM)"), {
        target: { value: "10" },
      });

      await reviewAndConfirm();

      await screen.findByText("Transaction submitted");
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ asset: "XLM", assetIssuer: undefined }),
      );
    });

    it("shows the selected asset's balance as a hint near the amount input (#565)", () => {
      vi.mocked(useSorokit).mockReturnValue({
        address: "GABC",
        isConnected: true,
        balances,
      } as unknown as ReturnType<typeof useSorokit>);

      render(<TransactionPanel />);

      expect(screen.getByText("Balance: 100.0000000 XLM")).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText("Asset"), {
        target: { value: "USDC" },
      });
      expect(screen.getByText("Balance: 50.0000000 USDC")).toBeInTheDocument();
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
        isConnected: true,
        network: { name: "testnet", passphrase: "x", rpcUrl: "x", horizonUrl: "x" },
      } as unknown as ReturnType<typeof useSorokit>);

      render(<TransactionPanel />);

      const validDest = VALID_DEST;
      fireEvent.change(screen.getByLabelText("Destination Address"), { target: { value: validDest } });
      fireEvent.change(screen.getByLabelText("Amount (XLM)"), { target: { value: "10" } });

      await reviewAndConfirm();
      await screen.findByText("Transaction submitted");

      expect(screen.getByText("Successful")).toBeInTheDocument();
      const link = screen.getByRole("link", { name: /view on stellar expert/i });
      expect(link).toHaveAttribute(
        "href",
        "https://stellar.expert/explorer/testnet/tx/txhash123",
      );
    });

    it("gives both explorer links an accessible aria-label (#563)", async () => {
      const mockSubmit = vi
        .fn()
        .mockResolvedValue({ data: { hash: "txhash123", ledger: 100 }, error: null });
      mockGetClient(mockSubmit);
      vi.mocked(useSorokit).mockReturnValue({
        address: "GABC",
        isConnected: true,
        network: { name: "testnet", passphrase: "x", rpcUrl: "x", horizonUrl: "x" },
        balances: [{ asset: "XLM", balance: "100" }],
        client: getClient(),
      } as unknown as ReturnType<typeof useSorokit>);

      render(<TransactionPanel />);

      const validDest = VALID_DEST;
      fireEvent.change(screen.getByLabelText("Destination Address"), { target: { value: validDest } });
      fireEvent.change(screen.getByLabelText("Amount (XLM)"), { target: { value: "10" } });

      await reviewAndConfirm();
      await screen.findByText("Transaction submitted");

      // Scoped to the two links this change touches — TransactionStatusTracker
      // renders its own separate explorer link lower in the panel.
      const hashLink = screen.getByText("txhash123").closest("a")!;
      const badgeLink = screen.getByRole("link", {
        name: /view on stellar expert/i,
      });
      for (const link of [hashLink, badgeLink]) {
        expect(link).toHaveAccessibleName(expect.stringContaining("txhash123"));
        expect(link).toHaveAccessibleName(expect.stringMatching(/opens in a new tab/i));
      }
    });
  });
});
