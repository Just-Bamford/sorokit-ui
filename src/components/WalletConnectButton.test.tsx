import { fireEvent,render, screen, waitFor } from "@testing-library/react";
import { beforeEach,describe, expect, it, vi } from "vitest";

import { useSorokit } from "@/context/useSorokit";
import { getClient } from "@/lib/client";

import { WalletConnectButton } from "./WalletConnectButton";

vi.mock("@/context/useSorokit", () => ({
  useSorokit: vi.fn(),
}));

describe("WalletConnectButton", () => {
  const mockConnect = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockUseSorokit(overrides: Partial<ReturnType<typeof useSorokit>> = {}) {
  return {
    get client() { return getClient(); },
      address: null,
      isConnected: false,
      isConnecting: false,
      connectWallet: vi.fn(),
      disconnectWallet: vi.fn(),
      account: null,
      balances: [],
      isLoadingAccount: false,
      refreshAccount: vi.fn(),
      network: null,
      switchNetwork: vi.fn(),
      error: null,
      clearError: vi.fn(),
      ...overrides,
    };
  }

  it("renders 'Connect Wallet' when not connected", () => {
    vi.mocked(useSorokit).mockReturnValue(mockUseSorokit({
      connectWallet: mockConnect,
      clearError: mockClearError,
    }));

    render(<WalletConnectButton />);
    expect(screen.getByRole("button", { name: "Connect Wallet" })).toBeInTheDocument();
  });

  it("opens the wallet connect modal on click", async () => {
    vi.mocked(useSorokit).mockReturnValue(mockUseSorokit({
      connectWallet: mockConnect,
      clearError: mockClearError,
    }));

    render(<WalletConnectButton />);
    fireEvent.click(screen.getByRole("button", { name: "Connect Wallet" }));
    await waitFor(() =>
      screen.getByRole("dialog", { name: /connect a wallet/i }),
    );
  });

  it("triggers connectWallet when a wallet is selected in the modal", async () => {
    vi.mocked(useSorokit).mockReturnValue(mockUseSorokit({
      connectWallet: mockConnect,
      clearError: mockClearError,
    }));

    render(<WalletConnectButton />);
    fireEvent.click(screen.getByRole("button", { name: "Connect Wallet" }));
    await waitFor(() =>
      screen.getByRole("dialog", { name: /connect a wallet/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Freighter" }));
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it("renders loading state when connecting", () => {
    vi.mocked(useSorokit).mockReturnValue(mockUseSorokit({
      isConnecting: true,
      connectWallet: mockConnect,
      clearError: mockClearError,
    }));

    render(<WalletConnectButton />);
    expect(screen.getByRole("button", { name: "Connecting…" })).toBeInTheDocument();
  });

  it("renders connected state with correct address and aria-label", () => {
    const fullAddress = "GABC1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    vi.mocked(useSorokit).mockReturnValue(mockUseSorokit({
      isConnected: true,
      address: fullAddress,
      connectWallet: mockConnect,
      clearError: mockClearError,
    }));

    render(<WalletConnectButton />);
    const button = screen.getByRole("button", {
      name: `Wallet connected: ${fullAddress}. Click to manage.`,
    });
    expect(button).toBeInTheDocument();
    expect(screen.getByText("GABC12...WXYZ")).toBeInTheDocument();
  });

  it("renders inline error message and handles clearError", () => {
    vi.mocked(useSorokit).mockReturnValue(mockUseSorokit({
      connectWallet: mockConnect,
      error: "Connection failed",
      clearError: mockClearError,
    }));

    render(<WalletConnectButton />);
    expect(screen.getByText("Connection failed")).toBeInTheDocument();

    const clearBtn = screen.getByRole("button", { name: "Clear error" });
    expect(clearBtn).toBeInTheDocument();
    fireEvent.click(clearBtn);
    expect(mockClearError).toHaveBeenCalledTimes(1);
  });

  it("renders disconnect loading state when isDisconnecting is true", () => {
    const mockDisconnect = vi.fn();
    vi.mocked(useSorokit).mockReturnValue(mockUseSorokit({
      isConnected: true,
      address: "GABC1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      disconnectWallet: mockDisconnect,
      isDisconnecting: true,
    }));

    render(<WalletConnectButton />);
    // Click the wallet button to open the dropdown with disconnect option
    fireEvent.click(screen.getByRole("button", { name: /wallet connected/i }));
    expect(screen.getByText("Disconnecting…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /disconnect/i })).toBeDisabled();
  });

  it("clears the error banner after a successful connect clears the error", () => {
    // First render with an error (not connected state)
    const { rerender } = render(<WalletConnectButton />);

    // Simulate error state
    vi.mocked(useSorokit).mockReturnValue(mockUseSorokit({
      connectWallet: mockConnect,
      error: "Previous error",
      clearError: mockClearError,
    }));
    rerender(<WalletConnectButton />);
    expect(screen.getByText("Previous error")).toBeInTheDocument();

    // Simulate successful connect (error is cleared, connected state shown)
    vi.mocked(useSorokit).mockReturnValue(mockUseSorokit({
      isConnected: true,
      address: "GABC1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      error: null,
      clearError: mockClearError,
    }));
    rerender(<WalletConnectButton />);
    expect(screen.queryByText("Previous error")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /wallet connected/i })).toBeInTheDocument();
  });
});
