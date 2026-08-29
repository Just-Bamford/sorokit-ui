import { fireEvent,render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { YieldFarmingScreen } from "./YieldFarmingScreen";

describe("YieldFarmingScreen", () => {
  it("renders Yield Farming Screen with positions", () => {
    render(<YieldFarmingScreen />);
    expect(screen.getByText("Yield Farming Positions")).toBeInTheDocument();
    expect(screen.getByTestId("total-rewards")).toBeInTheDocument();
    expect(screen.getAllByTestId("farming-card").length).toBeGreaterThan(0);
  });

  it("handles claiming rewards modal flow", () => {
    render(<YieldFarmingScreen />);
    
    // Open claim modal
    const claimBtns = screen.getAllByRole("button", { name: "Claim Rewards" });
    fireEvent.click(claimBtns[0]);

    expect(screen.getByTestId("claim-modal")).toBeInTheDocument();
    expect(screen.getByText("Confirm Claim")).toBeInTheDocument();

    // Confirm claim
    const confirmBtn = screen.getByRole("button", { name: "Confirm Claim" });
    fireEvent.click(confirmBtn);

    expect(screen.queryByTestId("claim-modal")).not.toBeInTheDocument();
  });

  it("handles remove liquidity modal flow", () => {
    render(<YieldFarmingScreen />);
    
    // Open remove modal
    const removeBtns = screen.getAllByRole("button", { name: "Remove Liquidity" });
    fireEvent.click(removeBtns[0]);

    expect(screen.getByTestId("remove-modal")).toBeInTheDocument();

    // Adjust slippage
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "1.5" } });
    expect(screen.getByText("1.5%")).toBeInTheDocument();

    // Confirm withdrawal
    const confirmBtn = screen.getByRole("button", { name: "Confirm Withdrawal" });
    fireEvent.click(confirmBtn);

    expect(screen.queryByTestId("remove-modal")).not.toBeInTheDocument();
  });
});
