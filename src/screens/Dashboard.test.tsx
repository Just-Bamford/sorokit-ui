import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Dashboard } from "./Dashboard";

vi.mock("@/context/useSorokit", () => ({
  useSorokit: vi.fn(() => ({
    isConnected: true,
    address: "GABC",
    account: null,
    balances: [],
    network: { name: "testnet" },
    error: null,
    clearError: vi.fn(),
  })),
}));

vi.mock("@/screens/WalletScreen", () => ({
  WalletScreen: () => <div data-testid="wallet-screen">WalletScreen</div>,
}));

vi.mock("@/screens/AccountScreen", () => ({
  AccountScreen: () => <div data-testid="account-screen">AccountScreen</div>,
}));

vi.mock("@/screens/TransactionsScreen", () => ({
  TransactionsScreen: () => <div data-testid="transactions-screen">TransactionsScreen</div>,
}));

vi.mock("@/screens/SorobanScreen", () => ({
  SorobanScreen: () => <div data-testid="soroban-screen">SorobanScreen</div>,
}));

vi.mock("@/screens/NetworkScreen", () => ({
  NetworkScreen: () => <div data-testid="network-screen">NetworkScreen</div>,
}));

describe("Dashboard screen mounting", () => {
  it("mounts only the default active screen (wallet) on load", () => {
    render(<Dashboard />);

    expect(screen.getByTestId("wallet-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("account-screen")).not.toBeInTheDocument();
    expect(screen.queryByTestId("transactions-screen")).not.toBeInTheDocument();
    expect(screen.queryByTestId("soroban-screen")).not.toBeInTheDocument();
    expect(screen.queryByTestId("network-screen")).not.toBeInTheDocument();
  });

  it("unmounts previous screen and mounts only the new active screen when navigating", () => {
    render(<Dashboard />);

    // Click Account in sidebar
    fireEvent.click(screen.getByRole("button", { name: /account/i }));
    expect(screen.getByTestId("account-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("wallet-screen")).not.toBeInTheDocument();

    // Click Transactions
    fireEvent.click(screen.getByRole("button", { name: /transactions/i }));
    expect(screen.getByTestId("transactions-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("account-screen")).not.toBeInTheDocument();

    // Click Soroban
    fireEvent.click(screen.getByRole("button", { name: /soroban/i }));
    expect(screen.getByTestId("soroban-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("transactions-screen")).not.toBeInTheDocument();

    // Click Network
    fireEvent.click(screen.getByRole("button", { name: /network/i }));
    expect(screen.getByTestId("network-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("soroban-screen")).not.toBeInTheDocument();
  });
});
