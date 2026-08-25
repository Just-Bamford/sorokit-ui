import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useSorokit } from "@/context/useSorokit";
import type { SorokitClient } from "@/lib/client";
import { createMockClient } from "@/lib/mock-client";

import App from "./App";

vi.mock("@/context/useSorokit", () => ({
  useSorokit: vi.fn(),
}));

vi.mock("@/screens/ConnectScreen", () => ({
  ConnectScreen: () => <div data-testid="connect-screen" />,
}));

vi.mock("@/screens/Dashboard", () => ({
  Dashboard: () => <div data-testid="dashboard" />,
}));

describe("App routing", () => {
  it("renders full-screen loading splash state when isInitializing is true", () => {
    vi.mocked(useSorokit).mockReturnValue({
      isInitializing: true,
      isConnected: false,
    } as ReturnType<typeof useSorokit>);

    render(<App client={createMockClient() as SorokitClient} />);

    expect(screen.getByTestId("loading-screen")).toBeInTheDocument();
    expect(screen.getByText("sorokit")).toBeInTheDocument();
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("status")).toHaveTextContent("Loading…");
    expect(screen.queryByTestId("connect-screen")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dashboard")).not.toBeInTheDocument();
  });

  it("renders ConnectScreen when isInitializing is false and the wallet is not connected", () => {
    vi.mocked(useSorokit).mockReturnValue({
      isInitializing: false,
      isConnected: false,
    } as ReturnType<typeof useSorokit>);
    render(<App client={createMockClient() as SorokitClient} />);
    expect(screen.getByTestId("connect-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("loading-screen")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dashboard")).not.toBeInTheDocument();
  });

  it("renders Dashboard when isInitializing is false and the wallet is connected", () => {
    vi.mocked(useSorokit).mockReturnValue({
      isInitializing: false,
      isConnected: true,
    } as ReturnType<typeof useSorokit>);
    render(<App client={createMockClient() as SorokitClient} />);
    expect(screen.getByTestId("dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("loading-screen")).not.toBeInTheDocument();
    expect(screen.queryByTestId("connect-screen")).not.toBeInTheDocument();
  });
});
