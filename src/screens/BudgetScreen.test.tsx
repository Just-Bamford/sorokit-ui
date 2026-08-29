import { act,fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BudgetScreen } from "./BudgetScreen";

describe("BudgetScreen", () => {
  it("renders Budget Screen and progress bar info", () => {
    render(<BudgetScreen />);
    expect(screen.getByText("Budget & Transaction Limits")).toBeInTheDocument();
    expect(screen.getByText(/of budget utilized/i)).toBeInTheDocument();
  });

  it("allows setting a budget limit and warning threshold", () => {
    render(<BudgetScreen />);
    
    // Set budget limit
    const limitInput = screen.getByLabelText("Set Budget Limit ($)");
    fireEvent.change(limitInput, { target: { value: "2000" } });
    expect(screen.getByText(/USDC/i)).toBeInTheDocument(); // breakdowns exist

    // Warn threshold slider
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "85" } });
    expect(screen.getByText("85%")).toBeInTheDocument();
  });

  it("can toggle transaction locking", () => {
    render(<BudgetScreen />);
    
    const checkbox = screen.getByTestId("lock-checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
  });

  it("exports spending reports successfully", async () => {
    vi.useFakeTimers();
    render(<BudgetScreen />);
    
    const exportCsvBtn = screen.getByRole("button", { name: "Export CSV" });
    fireEvent.click(exportCsvBtn);

    expect(screen.getByTestId("export-status")).toHaveTextContent("Generating CSV report...");

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId("export-status")).toHaveTextContent(/Report exported as sorokit-spending-report.csv/i);
    vi.useRealTimers();
  });
});
