import { screen, act, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSorokit } from "./useSorokit";
import { getClient } from "@/lib/client";
import { renderWithProvider } from "@/__tests__/utils";

const TestComponent = () => {
  const { address, account, balances, error, connectWallet, disconnectWallet, switchNetwork } = useSorokit();
  
  return (
    <div>
      <div data-testid="address">{address || "none"}</div>
      <div data-testid="account">{account ? account.sequence : "none"}</div>
      <div data-testid="balances">{balances.length}</div>
      <div data-testid="error">{error || "none"}</div>
      <button onClick={() => connectWallet()}>Connect</button>
      <button onClick={() => disconnectWallet()}>Disconnect</button>
      <button onClick={() => switchNetwork("testnet")}>Switch</button>
    </div>
  );
};

describe("SorokitProvider", () => {
  let mockClient: ReturnType<typeof getClient>;

  beforeEach(() => {
    mockClient = {
      wallet: {
        connect: vi.fn().mockResolvedValue({ data: { address: "GABC" }, error: null }),
        disconnect: vi.fn().mockResolvedValue(undefined),
      },
      account: {
        getAccount: vi.fn().mockResolvedValue({ data: { sequence: "100" }, error: null }),
        getBalances: vi.fn().mockResolvedValue({ data: [{ asset: "XLM", balance: "10" }], error: null }),
      },
      network: {
        getNetwork: vi.fn().mockResolvedValue({ data: { name: "mainnet" }, error: null }),
        switchNetwork: vi.fn().mockResolvedValue({ data: { name: "testnet" }, error: null }),
      },
    } as unknown as ReturnType<typeof getClient>;
  });

  it("disconnectWallet clears address, account, balances, and error", async () => {
    mockClient.account.getAccount = vi.fn().mockResolvedValue({ data: null, error: "Account error" });
    mockClient.account.getBalances = vi.fn().mockResolvedValue({ data: null, error: "Balances error" });

    renderWithProvider(<TestComponent />, { client: mockClient });

    const connectBtn = screen.getByText("Connect");
    const disconnectBtn = screen.getByText("Disconnect");

    await act(async () => {
      fireEvent.click(connectBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent("Account error; Balances error");
    });

    await act(async () => {
      fireEvent.click(disconnectBtn);
    });

    expect(screen.getByTestId("address")).toHaveTextContent("none");
    expect(screen.getByTestId("account")).toHaveTextContent("none");
    expect(screen.getByTestId("balances")).toHaveTextContent("0");
    expect(screen.getByTestId("error")).toHaveTextContent("none");
  });

  it("combines error strings when both getAccount and getBalances fail", async () => {
    mockClient.account.getAccount = vi.fn().mockResolvedValue({ data: null, error: "Account failed" });
    mockClient.account.getBalances = vi.fn().mockResolvedValue({ data: null, error: "Balances failed" });

    renderWithProvider(<TestComponent />, { client: mockClient });

    await act(async () => {
      fireEvent.click(screen.getByText("Connect"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent("Account failed; Balances failed");
    });
  });

  it("shows single error when only getAccount fails", async () => {
    mockClient.account.getAccount = vi.fn().mockResolvedValue({ data: null, error: "Account not found" });
    mockClient.account.getBalances = vi.fn().mockResolvedValue({ data: [{ asset: "XLM", balance: "10" }], error: null });

    renderWithProvider(<TestComponent />, { client: mockClient });

    await act(async () => {
      fireEvent.click(screen.getByText("Connect"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent("Account not found");
      expect(screen.getByTestId("balances")).toHaveTextContent("1");
    });
  });

  it("shows single error when only getBalances fails", async () => {
    mockClient.account.getAccount = vi.fn().mockResolvedValue({ data: { sequence: "100" }, error: null });
    mockClient.account.getBalances = vi.fn().mockResolvedValue({ data: null, error: "Failed to fetch balances" });

    renderWithProvider(<TestComponent />, { client: mockClient });

    await act(async () => {
      fireEvent.click(screen.getByText("Connect"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent("Failed to fetch balances");
      expect(screen.getByTestId("account")).toHaveTextContent("100");
    });
  });

  it("clears error from previous session on reconnect", async () => {
    mockClient.account.getAccount = vi.fn().mockResolvedValueOnce({ data: null, error: "Old error" });
    mockClient.account.getBalances = vi.fn().mockResolvedValueOnce({ data: [], error: null });

    renderWithProvider(<TestComponent />, { client: mockClient });

    await act(async () => {
      fireEvent.click(screen.getByText("Connect"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent("Old error");
    });

    // Next connect with different address succeeds
    mockClient.wallet.connect = vi.fn().mockResolvedValue({ data: { address: "GDEF" }, error: null });
    mockClient.account.getAccount = vi.fn().mockResolvedValue({ data: { sequence: "200" }, error: null });
    mockClient.account.getBalances = vi.fn().mockResolvedValue({ data: [{ asset: "XLM", balance: "50" }], error: null });

    await act(async () => {
      fireEvent.click(screen.getByText("Connect"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("address")).toHaveTextContent("GDEF");
      expect(screen.getByTestId("error")).toHaveTextContent("none");
      expect(screen.getByTestId("account")).toHaveTextContent("200");
    });
  });

  it("connectWallet populates address on success", async () => {
    renderWithProvider(<TestComponent />, { client: mockClient });
    
    expect(screen.getByTestId("address")).toHaveTextContent("none");

    await act(async () => {
      fireEvent.click(screen.getByText("Connect"));
    });

    expect(screen.getByTestId("address")).toHaveTextContent("GABC");
  });

  it("switchNetwork updates network state", async () => {
    renderWithProvider(<TestComponent />, { client: mockClient });

    await act(async () => {
      fireEvent.click(screen.getByText("Switch"));
    });

    expect(mockClient.network.switchNetwork).toHaveBeenCalledWith("testnet");
  });
});
