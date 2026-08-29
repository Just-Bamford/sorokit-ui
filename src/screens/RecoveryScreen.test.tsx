import { act,fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RecoveryScreen } from "./RecoveryScreen";

describe("RecoveryScreen", () => {
  it("renders Recovery Screen heading and audit panel", () => {
    render(<RecoveryScreen />);
    expect(screen.getByText("Account Recovery Assistant")).toBeInTheDocument();
    expect(screen.getByTestId("audit-badge")).toBeInTheDocument();
  });

  it("can add and revoke a recovery signer", () => {
    render(<RecoveryScreen />);
    
    // Add signer
    const addressInput = screen.getByLabelText("Signer Address");
    const nameInput = screen.getByLabelText("Signer Name");
    const submitBtn = screen.getByRole("button", { name: "Register Recovery Signer" });

    fireEvent.change(addressInput, { target: { value: "GDDDD...4444" } });
    fireEvent.change(nameInput, { target: { value: "New Ledger Key" } });
    fireEvent.click(submitBtn);

    expect(screen.getByText("New Ledger Key")).toBeInTheDocument();

    // Revoke signer
    const revokeBtn = screen.getByLabelText("Revoke New Ledger Key");
    fireEvent.click(revokeBtn);

    expect(screen.queryByText("New Ledger Key")).not.toBeInTheDocument();
  });

  it("runs the dry-run recovery simulation", async () => {
    vi.useFakeTimers();
    render(<RecoveryScreen />);

    const simBtn = screen.getByRole("button", { name: "Initiate Dry-run" });
    fireEvent.click(simBtn);

    expect(screen.getByText(/Initiating account recovery assistant/i)).toBeInTheDocument();

    // Advance first step
    await act(async () => {
      vi.advanceTimersByTime(800);
    });
    expect(screen.getByText(/Step 1: Validating primary key credentials/i)).toBeInTheDocument();

    // Advance second step
    await act(async () => {
      vi.advanceTimersByTime(800);
    });
    expect(screen.getByText(/Success: Co-signer signatures verified successfully/i)).toBeInTheDocument();

    vi.useRealTimers();
  });
});
