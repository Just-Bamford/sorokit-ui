import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSorokit } from "@/context/useSorokit";
import { getClient } from "@/lib/client";

import { ClaimableBalanceCard } from "./ClaimableBalanceCard";

vi.mock("@/context/useSorokit", () => ({
  useSorokit: vi.fn(),
}));

vi.mock("@/lib/client", () => ({
  getClient: vi.fn(),
}));

describe("ClaimableBalanceCard", () => {
  // `ClaimableBalanceCard` reads `client` from `useSorokit()` directly, not
  // from `getClient()` — the `@/lib/client` mock only supplies the type, so
  // `vi.mocked(getClient).mockReturnValue(...)` alone (the pattern every
  // test below already used) never actually reached the component: `client`
  // was always undefined, every fetch silently no-op'd, and the card stayed
  // on its empty state regardless of what the test configured. `client` is
  // a getter here (not a value captured at mockConnected()'s call time) so
  // it still picks up whichever `getClient` mock a test configures
  // afterward, regardless of call order.
  function mockConnected(address = "GABC123") {
    vi.mocked(useSorokit).mockReturnValue({
      address,
      isConnected: true,
      get client() {
        return getClient();
      },
    } as unknown as ReturnType<typeof useSorokit>);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe("connection state", () => {
    it("renders nothing when not connected", () => {
      vi.mocked(useSorokit).mockReturnValue({
        address: null,
        isConnected: false,
      } as unknown as ReturnType<typeof useSorokit>);
      const { container } = render(<ClaimableBalanceCard />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("fetch states", () => {
    it("shows fetch error when getClaimableBalances returns an error", async () => {
      mockConnected();
      vi.mocked(getClient).mockReturnValue({
        account: {
          getClaimableBalances: vi.fn().mockResolvedValue({ data: null, error: "Failed to fetch balances" }),
          claimBalance: vi.fn(),
        },
      } as unknown as ReturnType<typeof getClient>);
      render(<ClaimableBalanceCard />);
      expect(await screen.findByText("Failed to fetch balances")).toBeInTheDocument();
    });

    it("shows empty state when no claimable balances exist", async () => {
      mockConnected();
      vi.mocked(getClient).mockReturnValue({
        account: {
          getClaimableBalances: vi.fn().mockResolvedValue({ data: [], error: null }),
          claimBalance: vi.fn(),
        },
      } as unknown as ReturnType<typeof getClient>);
      render(<ClaimableBalanceCard />);
      expect(await screen.findByText(/no claimable balances/i)).toBeInTheDocument();
    });
  });

  describe("claim flow", () => {
    it("shows error and re-enables button on claim failure, removes the row on success", async () => {
      mockConnected();
      const mockClaimBalance = vi.fn()
        .mockResolvedValueOnce({ data: null, error: "Network error" })
        .mockResolvedValueOnce({ data: { hash: "tx123" }, error: null });
      vi.mocked(getClient).mockReturnValue({
        account: {
          getClaimableBalances: vi.fn().mockResolvedValue({
            data: [{
              id: "cb1", asset: "XLM:GABC", amount: "10.0", sponsor: "GDEF",
              claimants: [{ destination: "GDEF", predicate: { unconditional: true } }],
            }],
            error: null,
          }),
          claimBalance: mockClaimBalance,
        },
      } as unknown as ReturnType<typeof getClient>);

      render(<ClaimableBalanceCard />);
      expect(await screen.findByText("10.00")).toBeInTheDocument();

      const claimButton = screen.getByRole("button", { name: "Claim" });
      fireEvent.click(claimButton);
      expect(await screen.findByText("Network error")).toBeInTheDocument();
      expect(claimButton).not.toBeDisabled();

      fireEvent.click(claimButton);
      expect(await screen.findByText(/no claimable balances/i)).toBeInTheDocument();
      expect(screen.queryByText("10.00")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Claim" })).not.toBeInTheDocument();
    });

    it("shows an error and does not remove the row when the API resolves with no data and no error", async () => {
      mockConnected();
      const mockClaimBalance = vi.fn().mockResolvedValue({ data: null, error: null });
      vi.mocked(getClient).mockReturnValue({
        account: {
          getClaimableBalances: vi.fn().mockResolvedValue({
            data: [{
              id: "cb1", asset: "XLM:GABC", amount: "10.0", sponsor: "GDEF",
              claimants: [{ destination: "GDEF", predicate: { unconditional: true } }],
            }],
            error: null,
          }),
          claimBalance: mockClaimBalance,
        },
      } as unknown as ReturnType<typeof getClient>);

      render(<ClaimableBalanceCard />);
      const claimButton = await screen.findByRole("button", { name: "Claim" });
      fireEvent.click(claimButton);

      expect(await screen.findByText(/claim did not complete/i)).toBeInTheDocument();
      expect(claimButton).not.toBeDisabled();
      expect(screen.queryByText("Claimed")).not.toBeInTheDocument();
      expect(screen.getByText("10.00")).toBeInTheDocument();
    });

    it("removes only the claimed balance and updates the header count when multiple balances exist", async () => {
      mockConnected();
      const mockClaimBalance = vi.fn().mockResolvedValue({ data: { hash: "tx123" }, error: null });
      vi.mocked(getClient).mockReturnValue({
        account: {
          getClaimableBalances: vi.fn().mockResolvedValue({
            data: [
              {
                id: "cb1", asset: "XLM:GABC", amount: "10.0", sponsor: "GDEF",
                claimants: [{ destination: "GDEF", predicate: { unconditional: true } }],
              },
              {
                id: "cb2", asset: "XLM:GABC", amount: "20.0", sponsor: "GDEF",
                claimants: [{ destination: "GDEF", predicate: { unconditional: true } }],
              },
            ],
            error: null,
          }),
          claimBalance: mockClaimBalance,
        },
      } as unknown as ReturnType<typeof getClient>);

      render(<ClaimableBalanceCard />);
      expect(await screen.findByText("10.00")).toBeInTheDocument();
      expect(screen.getByText("20.00")).toBeInTheDocument();
      expect(screen.getByText("2 pending")).toBeInTheDocument();

      const claimButtons = screen.getAllByRole("button", { name: "Claim" });
      fireEvent.click(claimButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText("10.00")).not.toBeInTheDocument();
      });
      expect(screen.getByText("20.00")).toBeInTheDocument();
      expect(screen.getByText("1 pending")).toBeInTheDocument();
      expect(mockClaimBalance).toHaveBeenCalledWith("cb1");
    });
  });

  describe("balance ID copy", () => {
    function setupBalanceIdTest() {
      mockConnected();
      vi.mocked(getClient).mockReturnValue({
        account: {
          getClaimableBalances: vi.fn().mockResolvedValue({
            data: [{
              id: "BALANCE_ID_1234567890",
              asset: "native",
              amount: "5.0",
              sponsor: "GDEF",
              claimants: [{ destination: "GDEF", predicate: { unconditional: true } }],
            }],
            error: null,
          }),
          claimBalance: vi.fn(),
        },
      } as unknown as ReturnType<typeof getClient>);
    }

    it("shows balance ID", async () => {
      setupBalanceIdTest();
      render(<ClaimableBalanceCard />);
      expect(await screen.findByText("5.00")).toBeInTheDocument();
    });

    it("copies balance ID to clipboard on click", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText },
        configurable: true,
        writable: true,
      });
      setupBalanceIdTest();
      render(<ClaimableBalanceCard />);
      await screen.findByText("5.00");
      const copyBtn = screen.getByRole("button", { name: /copy balance id/i });
      fireEvent.click(copyBtn);
      expect(writeText).toHaveBeenCalledWith("BALANCE_ID_1234567890");
    });

    it("shows copied state briefly after copying balance ID", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText },
        configurable: true,
        writable: true,
      });
      setupBalanceIdTest();
      render(<ClaimableBalanceCard />);
      expect(await screen.findByText("5.00")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /copy balance id/i }));
      expect(screen.getByRole("button", { name: /balance id copied/i })).toBeInTheDocument();
    });
  });

  describe("predicate expiry disabled state", () => {
    it("disables Claim button and shows Expired badge when predicate has expired timebound", async () => {
      mockConnected();
      const expiredTime = Date.now() - 10000;
      vi.mocked(getClient).mockReturnValue({
        account: {
          getClaimableBalances: vi.fn().mockResolvedValue({
            data: [{
              id: "cb-expired",
              asset: "native",
              amount: "100.0",
              sponsor: "GDEF",
              claimants: [{ destination: "GDEF", predicate: { timeBound: { start: 0, end: expiredTime } } }],
            }],
            error: null,
          }),
          claimBalance: vi.fn(),
        },
      } as unknown as ReturnType<typeof getClient>);
      render(<ClaimableBalanceCard />);
      expect(await screen.findByText("Expired")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Claim" })).toBeDisabled();
    });

    it("keeps Claim button enabled when predicate is unconditional", async () => {
      mockConnected();
      vi.mocked(getClient).mockReturnValue({
        account: {
          getClaimableBalances: vi.fn().mockResolvedValue({
            data: [{
              id: "cb-active",
              asset: "native",
              amount: "50.0",
              sponsor: "GDEF",
              claimants: [{ destination: "GDEF", predicate: { unconditional: true } }],
            }],
            error: null,
          }),
          claimBalance: vi.fn(),
        },
      } as unknown as ReturnType<typeof getClient>);
      render(<ClaimableBalanceCard />);
      expect(await screen.findByText("50.00")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Claim" })).not.toBeDisabled();
    });

    it("keeps Claim button enabled when predicate has a future timebound", async () => {
      mockConnected();
      const futureTime = Date.now() + 100000;
      vi.mocked(getClient).mockReturnValue({
        account: {
          getClaimableBalances: vi.fn().mockResolvedValue({
            data: [{
              id: "cb-future",
              asset: "native",
              amount: "25.0",
              sponsor: "GDEF",
              claimants: [{ destination: "GDEF", predicate: { timeBound: { start: 0, end: futureTime } } }],
            }],
            error: null,
          }),
          claimBalance: vi.fn(),
        },
      } as unknown as ReturnType<typeof getClient>);
      render(<ClaimableBalanceCard />);
      expect(await screen.findByText("25.00")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Claim" })).not.toBeDisabled();
    });
  });

  describe("confirmThreshold dialog", () => {
    function setupThresholdTest(amount: string, _threshold: string) {
      mockConnected();
      vi.mocked(getClient).mockReturnValue({
        account: {
          getClaimableBalances: vi.fn().mockResolvedValue({
            data: [{
              id: "cb-threshold",
              asset: "native",
              amount,
              sponsor: "GDEF",
              claimants: [{ destination: "GDEF", predicate: { unconditional: true } }],
            }],
            error: null,
          }),
          claimBalance: vi.fn().mockResolvedValue({ data: { hash: "tx123" }, error: null }),
        },
      } as unknown as ReturnType<typeof getClient>);
    }

    it("shows confirmation dialog when amount exceeds threshold", async () => {
      setupThresholdTest("5000.0", "1000");
      render(<ClaimableBalanceCard confirmThreshold="1000" />);
      expect(await screen.findByText("5,000.00")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Claim" }));
      expect(await screen.findByText("Confirm Claim")).toBeInTheDocument();
    });

    it("does not show confirmation dialog when amount is below threshold", async () => {
      setupThresholdTest("5.0", "1000");
      render(<ClaimableBalanceCard confirmThreshold="1000" />);
      expect(await screen.findByText("5.00")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Claim" }));
      await screen.findByText(/no claimable balances/i);
      expect(screen.queryByText("Confirm Claim")).not.toBeInTheDocument();
    });

    it("cancels the dialog and does not claim", async () => {
      setupThresholdTest("5000.0", "1000");
      render(<ClaimableBalanceCard confirmThreshold="1000" />);
      expect(await screen.findByText("5,000.00")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Claim" }));
      expect(await screen.findByText("Confirm Claim")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(screen.queryByText("Confirm Claim")).not.toBeInTheDocument();
    });

    it("proceeds with claim after confirming the dialog", async () => {
      setupThresholdTest("5000.0", "1000");
      render(<ClaimableBalanceCard confirmThreshold="1000" />);
      expect(await screen.findByText("5,000.00")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Claim" }));
      expect(await screen.findByText("Confirm Claim")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
      expect(await screen.findByText(/no claimable balances/i)).toBeInTheDocument();
    });
  });

  describe("combined: balance ID + expiry + confirmThreshold", () => {
    it("renders all three b17 features together for a single balance", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText },
        configurable: true,
        writable: true,
      });
      mockConnected();
      const futureTime = Date.now() + 100000;
      vi.mocked(getClient).mockReturnValue({
        account: {
          getClaimableBalances: vi.fn().mockResolvedValue({
            data: [{
              id: "FEATURE_COMBO_ID_123",
              asset: "USDC:GBPL",
              amount: "2500.0",
              sponsor: "GDEF456",
              claimants: [{ destination: "GDEF456", predicate: { timeBound: { start: 0, end: futureTime } } }],
            }],
            error: null,
          }),
          claimBalance: vi.fn(),
        },
      } as unknown as ReturnType<typeof getClient>);
      render(<ClaimableBalanceCard confirmThreshold="2000" />);

      expect(await screen.findByText("2,500.00")).toBeInTheDocument();

      expect(screen.queryByText("Expired")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Claim" })).not.toBeDisabled();

      fireEvent.click(screen.getByRole("button", { name: "Claim" }));
      expect(await screen.findByText("Confirm Claim")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /copy balance id/i })).toBeInTheDocument();
    });
  });
});
