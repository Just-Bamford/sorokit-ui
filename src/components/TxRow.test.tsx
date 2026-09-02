import { render, screen } from "@testing-library/react";

import type { Transaction } from "@/lib/client";

import { TxRow } from "./TransactionHistory";

describe("TxRow component", () => {
  it("renders transaction hash, ledger, status badge, fee, and date", () => {
    const tx: Transaction = {
      hash: "hash123",
      ledger: 1000,
      createdAt: new Date("2026-07-01T18:52:00").toISOString(),
      successful: true,
      operationCount: 1,
      feePaid: "100",
    } as Transaction;
    render(<TxRow tx={tx} />);
    expect(screen.getByText(/hash123/)).toBeInTheDocument();
    expect(screen.getByText(/Ledger 1000/)).toBeInTheDocument();
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText(/100 stroops/)).toBeInTheDocument();
  });

  it("shows Failed badge for unsuccessful transactions", () => {
    const tx: Transaction = {
      hash: "hash-fail",
      ledger: 1002,
      createdAt: new Date().toISOString(),
      successful: false,
      operationCount: 1,
      feePaid: "0",
    } as Transaction;
    render(<TxRow tx={tx} />);
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  // ── feePaid display (#178) ───────────────────────────────────────────────
  it("renders the feePaid value in stroops", () => {
    const tx: Transaction = {
      hash: "hash-fee",
      ledger: 1003,
      createdAt: new Date().toISOString(),
      successful: true,
      operationCount: 1,
      feePaid: "12345",
    } as Transaction;
    render(<TxRow tx={tx} />);
    expect(screen.getByText(/12345 stroops/)).toBeInTheDocument();
  });

  // ── Memo truncation (#178) ───────────────────────────────────────────────
  it("truncates a memo longer than 20 characters and shows the full memo in the title attribute", () => {
    const longMemo = "a".repeat(30);
    const tx: Transaction = {
      hash: "hash-memo",
      ledger: 1004,
      createdAt: new Date().toISOString(),
      successful: true,
      operationCount: 1,
      feePaid: "100",
      memo: longMemo,
    } as Transaction;
    render(<TxRow tx={tx} />);

    const truncated = `${longMemo.slice(0, 20)}…`;
    const memoEl = screen.getByText(`· ${truncated}`);
    expect(memoEl).toBeInTheDocument();
    expect(memoEl).toHaveAttribute("title", longMemo);
    expect(memoEl.textContent).not.toContain(longMemo);
  });

  it("does not truncate a memo of 20 characters or fewer", () => {
    const shortMemo = "short memo";
    const tx: Transaction = {
      hash: "hash-short-memo",
      ledger: 1005,
      createdAt: new Date().toISOString(),
      successful: true,
      operationCount: 1,
      feePaid: "100",
      memo: shortMemo,
    } as Transaction;
    render(<TxRow tx={tx} />);

    const memoEl = screen.getByText(`· ${shortMemo}`);
    expect(memoEl).toBeInTheDocument();
    expect(memoEl).toHaveAttribute("title", shortMemo);
  });

  // ── operationCount badge (#200) ──────────────────────────────────────────
  it("shows an operation count badge when operationCount > 1", () => {
    const tx: Transaction = {
      hash: "hash-multi-ops",
      ledger: 1006,
      createdAt: new Date().toISOString(),
      successful: true,
      operationCount: 3,
      feePaid: "300",
    } as Transaction;
    render(<TxRow tx={tx} />);
    expect(screen.getByText("3 ops")).toBeInTheDocument();
  });

  it("does not show an operation count badge when operationCount is 1", () => {
    const tx: Transaction = {
      hash: "hash-single-op",
      ledger: 1007,
      createdAt: new Date().toISOString(),
      successful: true,
      operationCount: 1,
      feePaid: "100",
    } as Transaction;
    render(<TxRow tx={tx} />);
    expect(screen.queryByText(/^\d+ ops$/)).not.toBeInTheDocument();
  });
});
