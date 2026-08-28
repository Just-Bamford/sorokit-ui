import { act,fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach,describe, expect, it, vi } from "vitest";

import { useSorokit } from "@/context/useSorokit";
import type { SorokitClient, Transaction } from "@/lib/client";
import { getClient } from "@/lib/client";

import { TransactionHistory } from "./TransactionHistory";

vi.mock("@/context/useSorokit", () => ({
  useSorokit: vi.fn(),
}));
vi.mock("@/lib/client", () => ({
  getClient: vi.fn(),
}));

const ADDRESS = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWNA";
const PAGE_SIZE = 10;

function makeTx(i: number): Transaction {
  return {
    hash: `hash${String(i).padStart(56, "0")}`,
    ledger: 1000 + i,
    successful: true,
    createdAt: new Date("2024-01-01").toISOString(),
    memo: null,
  };
}

function mockGetHistory(txs: Transaction[], total: number) {
  vi.mocked(getClient).mockReturnValue({
    transaction: {
      getHistory: vi.fn().mockResolvedValue({ data: txs, error: null, total }),
    },
  } as unknown as SorokitClient);
}

describe("TransactionHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(useSorokit).mockReturnValue({
      address: ADDRESS,
      isConnected: true,
    } as unknown as ReturnType<typeof useSorokit>);
    vi.mocked(getClient).mockReturnValue({
      transaction: { getHistory: vi.fn().mockResolvedValue({ data: [], error: null, total: 0 }) },
      operation: { getOperations: vi.fn().mockResolvedValue({ data: [], error: null }) },
    } as unknown as SorokitClient);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders 'Connect your wallet' when not connected", () => {
    vi.mocked(useSorokit).mockReturnValue({
      address: null,
      isConnected: false,
    } as unknown as ReturnType<typeof useSorokit>);
    vi.mocked(getClient).mockReturnValue({
      transaction: { getHistory: vi.fn() },
    } as unknown as SorokitClient);

    render(<TransactionHistory />);
    expect(screen.getByText(/connect your wallet/i)).toBeInTheDocument();
  });

  it("renders the empty state with icon and message on testnet", async () => {
    vi.mocked(useSorokit).mockReturnValue({
      address: ADDRESS,
      isConnected: true,
      network: { name: "testnet" },
    } as unknown as ReturnType<typeof useSorokit>);
    mockGetHistory([], 0);
    const { container } = render(<TransactionHistory />);
    act(() => { vi.advanceTimersByTime(0); });

    await waitFor(() => {
      expect(screen.getByText("No transactions yet")).toBeInTheDocument();
    });
    const iconContainer = container.querySelector('[aria-hidden="true"]');
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer?.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /fund with friendbot/i })).toHaveAttribute(
      "href",
      "https://friendbot.stellar.org",
    );
  });

  it("does not show Friendbot outside testnet", async () => {
    mockGetHistory([], 0);
    render(<TransactionHistory />);
    act(() => { vi.advanceTimersByTime(0); });

    await screen.findByText("No transactions yet");
    expect(screen.queryByRole("link", { name: /friendbot/i })).not.toBeInTheDocument();
  });

  it("does not render pagination when total ≤ PAGE_SIZE", async () => {
    const txs = Array.from({ length: PAGE_SIZE }, (_, i) => makeTx(i));
    mockGetHistory(txs, PAGE_SIZE);
    render(<TransactionHistory />);
    act(() => { vi.advanceTimersByTime(0); });

    await waitFor(() => screen.getByText(/1000/)); // first tx's ledger
    expect(screen.queryByText("Prev")).not.toBeInTheDocument();
    expect(screen.queryByText("Next")).not.toBeInTheDocument();
  });

  it("renders pagination controls when total > PAGE_SIZE", async () => {
    const txs = Array.from({ length: PAGE_SIZE }, (_, i) => makeTx(i));
    mockGetHistory(txs, PAGE_SIZE + 1); // 11 total → 2 pages
    render(<TransactionHistory />);
    act(() => { vi.advanceTimersByTime(0); });

    await waitFor(() => {
      expect(screen.getByText("Prev")).toBeInTheDocument();
      expect(screen.getByText("Next")).toBeInTheDocument();
    });
  });

  it("disables Prev button on page 1", async () => {
    const txs = Array.from({ length: PAGE_SIZE }, (_, i) => makeTx(i));
    mockGetHistory(txs, 25);
    render(<TransactionHistory />);
    act(() => { vi.advanceTimersByTime(0); });

    await waitFor(() => screen.getByText("Prev"));
    const prevBtn = screen.getByRole("button", { name: /prev/i });
    expect(prevBtn).toBeDisabled();
  });

  it("clicking Next increments the page and calls getHistory with page 2", async () => {
    const getHistory = vi.fn().mockResolvedValue({
      data: Array.from({ length: PAGE_SIZE }, (_, i) => makeTx(i)),
      error: null,
      total: 25,
    });
    vi.mocked(getClient).mockReturnValue({
      transaction: { getHistory },
    } as unknown as SorokitClient);

    render(<TransactionHistory />);
    act(() => { vi.advanceTimersByTime(0); });
    await waitFor(() => screen.getByText("Next"));
    expect(getHistory).toHaveBeenCalledWith(ADDRESS, 1, PAGE_SIZE);

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    act(() => { vi.advanceTimersByTime(0); });

    await waitFor(() => {
      expect(getHistory).toHaveBeenCalledWith(ADDRESS, 2, PAGE_SIZE);
    });
    expect(sessionStorage.getItem(`sorokit-transaction-history-page:${ADDRESS}`)).toBe("2");
  });

  it("restores the current page from sessionStorage for the connected address", async () => {
    sessionStorage.setItem(`sorokit-transaction-history-page:${ADDRESS}`, "2");
    const getHistory = vi.fn().mockResolvedValue({
      data: Array.from({ length: PAGE_SIZE }, (_, i) => makeTx(i)),
      error: null,
      total: 25,
    });
    vi.mocked(getClient).mockReturnValue({
      transaction: { getHistory },
    } as unknown as SorokitClient);

    render(<TransactionHistory />);
    act(() => { vi.advanceTimersByTime(0); });

    await waitFor(() =>
      expect(getHistory).toHaveBeenCalledWith(ADDRESS, 2, PAGE_SIZE),
    );
  });

  it("persists and restores page in sessionStorage across remount", async () => {
    const getHistory = vi.fn().mockResolvedValue({
      data: Array.from({ length: PAGE_SIZE }, (_, i) => makeTx(i)),
      error: null,
      total: 25,
    });
    vi.mocked(getClient).mockReturnValue({
      transaction: { getHistory },
    } as unknown as SorokitClient);

    const { unmount } = render(<TransactionHistory />);
    act(() => { vi.advanceTimersByTime(0); });
    await waitFor(() => screen.getByText("Next"));

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    act(() => { vi.advanceTimersByTime(0); });
    await waitFor(() => {
      expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument();
    });
    expect(
      sessionStorage.getItem(`sorokit-transaction-history-page:${ADDRESS}`),
    ).toBe("2");

    getHistory.mockClear();
    unmount();

    render(<TransactionHistory />);
    act(() => { vi.advanceTimersByTime(0); });
    await waitFor(() => {
      expect(getHistory).toHaveBeenCalledWith(ADDRESS, 2, PAGE_SIZE);
    });
  });

  it("handles an invalid total without rendering invalid pagination", async () => {
    mockGetHistory([], Number.NaN);
    render(<TransactionHistory />);
    act(() => { vi.advanceTimersByTime(0); });

    await screen.findByText("No transactions yet");
    expect(screen.queryByText(/page .* of/i)).not.toBeInTheDocument();
  });

  it("disables Next button on the last page", async () => {
    const getHistory = vi.fn().mockResolvedValue({
      data: Array.from({ length: 5 }, (_, i) => makeTx(i)),
      error: null,
      total: 15,
    });
    vi.mocked(getClient).mockReturnValue({
      transaction: { getHistory },
    } as unknown as SorokitClient);

    render(<TransactionHistory />);
    act(() => { vi.advanceTimersByTime(0); });
    await waitFor(() => screen.getByText("Next"));

    // Navigate to page 2 (last page for total=15, pageSize=10)
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    act(() => { vi.advanceTimersByTime(0); });

    await waitFor(() => {
      expect(screen.getByText(/page 2 of 2/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("clicking Prev decrements the page and re-fetches page 1", async () => {
    const getHistory = vi.fn().mockResolvedValue({
      data: Array.from({ length: PAGE_SIZE }, (_, i) => makeTx(i)),
      error: null,
      total: 25,
    });
    vi.mocked(getClient).mockReturnValue({
      transaction: { getHistory },
    } as unknown as SorokitClient);

    render(<TransactionHistory />);
    act(() => { vi.advanceTimersByTime(0); });
    await waitFor(() => screen.getByText("Next"));

    // Go forward to page 2…
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    act(() => { vi.advanceTimersByTime(0); });
    await waitFor(() =>
      expect(getHistory).toHaveBeenCalledWith(ADDRESS, 2, PAGE_SIZE),
    );

    // …then back to page 1 via Prev.
    fireEvent.click(screen.getByRole("button", { name: /prev/i }));
    act(() => { vi.advanceTimersByTime(0); });
    await waitFor(() => {
      expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
    });
    expect(getHistory).toHaveBeenLastCalledWith(ADDRESS, 1, PAGE_SIZE);
    // Prev is disabled again on the first page.
    expect(screen.getByRole("button", { name: /prev/i })).toBeDisabled();
  });

  describe("row links to Stellar Expert (#350)", () => {
    it("links each row to its Stellar Expert transaction page on testnet", async () => {
      vi.mocked(useSorokit).mockReturnValue({
        address: ADDRESS,
        isConnected: true,
        network: { name: "testnet" },
      } as unknown as ReturnType<typeof useSorokit>);
      const tx = makeTx(0);
      mockGetHistory([tx], 1);

      render(<TransactionHistory />);
      act(() => { vi.advanceTimersByTime(0); });

      // The row carries an explicit role="article" (ARIA: an explicit role
      // overrides the <a> tag's implicit "link" role), so query by article
      // and assert on its href directly rather than by role="link".
      await waitFor(() => screen.getByRole("article"));
      expect(screen.getByRole("article")).toHaveAttribute(
        "href",
        `https://stellar.expert/explorer/testnet/tx/${tx.hash}`,
      );
    });

    it("links each row to its Stellar Expert transaction page on mainnet", async () => {
      vi.mocked(useSorokit).mockReturnValue({
        address: ADDRESS,
        isConnected: true,
        network: { name: "mainnet" },
      } as unknown as ReturnType<typeof useSorokit>);
      const tx = makeTx(0);
      mockGetHistory([tx], 1);

      render(<TransactionHistory />);
      act(() => { vi.advanceTimersByTime(0); });

      await waitFor(() => screen.getByRole("article"));
      expect(screen.getByRole("article")).toHaveAttribute(
        "href",
        `https://stellar.expert/explorer/public/tx/${tx.hash}`,
      );
    });

    it("renders a plain (non-link) row when the network is unrecognized", async () => {
      vi.mocked(useSorokit).mockReturnValue({
        address: ADDRESS,
        isConnected: true,
        network: { name: "futurenet" },
      } as unknown as ReturnType<typeof useSorokit>);
      const tx = makeTx(0);
      mockGetHistory([tx], 1);

      render(<TransactionHistory />);
      act(() => { vi.advanceTimersByTime(0); });

      await waitFor(() => screen.getByRole("article"));
      const row = screen.getByRole("article");
      expect(row.tagName).toBe("DIV");
      expect(row).not.toHaveAttribute("href");
    });
  });

  describe("status and date range filtering (#350, #352)", () => {
    function makeTxAt(hashSuffix: string, iso: string, successful: boolean): Transaction {
      return {
        hash: `hash${hashSuffix.padStart(56, "0")}`,
        ledger: 2000,
        successful,
        createdAt: new Date(iso).toISOString(),
        memo: null,
      };
    }

    it("the status filter shows only successful transactions when 'Success' is selected", async () => {
      const ok = makeTxAt("1", "2024-02-01", true);
      const failed = makeTxAt("2", "2024-02-02", false);
      mockGetHistory([ok, failed], 2);

      render(<TransactionHistory />);
      act(() => { vi.advanceTimersByTime(0); });
      await waitFor(() => screen.getAllByRole("article"));
      expect(screen.getAllByRole("article")).toHaveLength(2);

      fireEvent.click(screen.getByRole("button", { name: /^success$/i }));

      const rows = screen.getAllByRole("article");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveTextContent(ok.hash.slice(0, 10));
    });

    it("the status filter shows only failed transactions when 'Failed' is selected", async () => {
      const ok = makeTxAt("1", "2024-02-01", true);
      const failed = makeTxAt("2", "2024-02-02", false);
      mockGetHistory([ok, failed], 2);

      render(<TransactionHistory />);
      act(() => { vi.advanceTimersByTime(0); });
      await waitFor(() => screen.getAllByRole("article"));

      fireEvent.click(screen.getByRole("button", { name: /^failed$/i }));

      const rows = screen.getAllByRole("article");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveTextContent(failed.hash.slice(0, 10));
    });

    it("'All' shows every transaction regardless of status", async () => {
      const ok = makeTxAt("1", "2024-02-01", true);
      const failed = makeTxAt("2", "2024-02-02", false);
      mockGetHistory([ok, failed], 2);

      render(<TransactionHistory />);
      act(() => { vi.advanceTimersByTime(0); });
      await waitFor(() => screen.getAllByRole("article"));

      fireEvent.click(screen.getByRole("button", { name: /^failed$/i }));
      expect(screen.getAllByRole("article")).toHaveLength(1);

      fireEvent.click(screen.getByRole("button", { name: /^all$/i }));
      expect(screen.getAllByRole("article")).toHaveLength(2);
    });

    it("startDate excludes transactions before the given date", async () => {
      const early = makeTxAt("1", "2024-01-01", true);
      const late = makeTxAt("2", "2024-03-01", true);
      mockGetHistory([early, late], 2);

      render(<TransactionHistory startDate="2024-02-01" />);
      act(() => { vi.advanceTimersByTime(0); });

      await waitFor(() => screen.getAllByRole("article"));
      const rows = screen.getAllByRole("article");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveTextContent(late.hash.slice(0, 10));
    });

    it("endDate excludes transactions after the given date", async () => {
      const early = makeTxAt("1", "2024-01-01", true);
      const late = makeTxAt("2", "2024-03-01", true);
      mockGetHistory([early, late], 2);

      render(<TransactionHistory endDate="2024-02-01" />);
      act(() => { vi.advanceTimersByTime(0); });

      await waitFor(() => screen.getAllByRole("article"));
      const rows = screen.getAllByRole("article");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveTextContent(early.hash.slice(0, 10));
    });

    it("startDate and endDate together narrow to the transactions within range", async () => {
      const before = makeTxAt("1", "2024-01-01", true);
      const within = makeTxAt("2", "2024-02-15", true);
      const after = makeTxAt("3", "2024-03-01", true);
      mockGetHistory([before, within, after], 3);

      render(<TransactionHistory startDate="2024-02-01" endDate="2024-02-28" />);
      act(() => { vi.advanceTimersByTime(0); });

      await waitFor(() => screen.getAllByRole("article"));
      const rows = screen.getAllByRole("article");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveTextContent(within.hash.slice(0, 10));
    });

    it("combines the status filter and date range together", async () => {
      const withinOk = makeTxAt("1", "2024-02-10", true);
      const withinFailed = makeTxAt("2", "2024-02-11", false);
      const outsideOk = makeTxAt("3", "2024-05-01", true);
      mockGetHistory([withinOk, withinFailed, outsideOk], 3);

      render(<TransactionHistory startDate="2024-02-01" endDate="2024-02-28" />);
      act(() => { vi.advanceTimersByTime(0); });
      await waitFor(() => screen.getAllByRole("article"));
      expect(screen.getAllByRole("article")).toHaveLength(2);

      fireEvent.click(screen.getByRole("button", { name: /^success$/i }));

      const rows = screen.getAllByRole("article");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveTextContent(withinOk.hash.slice(0, 10));
    });
  });

  describe("fee total, multi-op filter, and trend sparkline", () => {
    /** Builds a tx with an explicit fee and operation count. */
    function makeFeeTx(
      id: string,
      feePaid: string,
      operationCount: number,
      createdAt = "2024-01-01",
    ): Transaction {
      return {
        hash: `hash${id.padStart(56, "0")}`,
        ledger: 1000,
        successful: true,
        createdAt: new Date(createdAt).toISOString(),
        memo: null,
        feePaid,
        operationCount,
      } as unknown as Transaction;
    }

    async function renderWith(txs: Transaction[], props = {}) {
      mockGetHistory(txs, txs.length);
      render(<TransactionHistory {...props} />);
      act(() => { vi.advanceTimersByTime(0); });
      await waitFor(() => screen.getAllByRole("article"));
    }

    it("sums feePaid across displayed transactions in the footer", async () => {
      await renderWith([
        makeFeeTx("1", "100", 1),
        makeFeeTx("2", "250", 1),
        makeFeeTx("3", "150", 1),
      ]);

      const footer = document.querySelector("[data-fee-total]");
      expect(footer).toHaveTextContent("Total fees: 500 stroops");
      expect(footer).toHaveTextContent("0.00005 XLM");
    });

    it("ignores unparseable fee values instead of rendering NaN", async () => {
      await renderWith([
        makeFeeTx("1", "100", 1),
        makeFeeTx("2", "not-a-number", 1),
      ]);

      const footer = document.querySelector("[data-fee-total]");
      expect(footer).toHaveTextContent("Total fees: 100 stroops");
      expect(footer?.textContent).not.toMatch(/NaN/);
    });

    it("filters to multi-operation transactions when Multi-op is toggled", async () => {
      await renderWith([
        makeFeeTx("1", "100", 1),
        makeFeeTx("2", "100", 3),
        makeFeeTx("3", "100", 1),
      ]);
      expect(screen.getAllByRole("article")).toHaveLength(3);

      const toggle = screen.getByRole("button", { name: /multi-op/i });
      fireEvent.click(toggle);

      expect(toggle).toHaveAttribute("aria-pressed", "true");
      const rows = screen.getAllByRole("article");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveTextContent("3 ops");

      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-pressed", "false");
      expect(screen.getAllByRole("article")).toHaveLength(3);
    });

    it("recomputes the fee total from the filtered set", async () => {
      await renderWith([
        makeFeeTx("1", "100", 1),
        makeFeeTx("2", "700", 2),
      ]);
      expect(document.querySelector("[data-fee-total]")).toHaveTextContent(
        "Total fees: 800 stroops",
      );

      fireEvent.click(screen.getByRole("button", { name: /multi-op/i }));
      expect(document.querySelector("[data-fee-total]")).toHaveTextContent(
        "Total fees: 700 stroops",
      );
    });

    it("hides the trend sparkline unless showTrend is set", async () => {
      await renderWith([makeFeeTx("1", "100", 1)]);
      expect(document.querySelectorAll("[data-trend-bar]")).toHaveLength(0);
    });

    it("renders a 7-bar sparkline when showTrend is set", async () => {
      await renderWith([makeFeeTx("1", "100", 1)], { showTrend: true });
      expect(document.querySelectorAll("[data-trend-bar]")).toHaveLength(7);
    });

    it("scales sparkline bars by each day's transaction count", async () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 86_400_000);
      await renderWith(
        [
          makeFeeTx("1", "100", 1, today.toISOString()),
          makeFeeTx("2", "100", 1, today.toISOString()),
          makeFeeTx("3", "100", 1, yesterday.toISOString()),
        ],
        { showTrend: true },
      );

      const bars = document.querySelectorAll("[data-trend-bar]");
      // Buckets are oldest-first, so today is the last bar and yesterday the one before.
      expect(bars[6]).toHaveAttribute("title", "2 transactions");
      expect(bars[5]).toHaveAttribute("title", "1 transaction");
      expect(bars[0]).toHaveAttribute("title", "0 transactions");
      expect((bars[6] as HTMLElement).style.height).toBe("100%");
      expect((bars[5] as HTMLElement).style.height).toBe("50%");
    });
  });
});
