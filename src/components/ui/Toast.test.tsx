import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach,beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider, useToast } from "../../context/ToastContext";
import { ToastContainer } from "./Toast";

/* ------------------------------------------------------------------ */
/*  Test helper                                                        */
/* ------------------------------------------------------------------ */

function TestHarness() {
  const toast = useToast();
  return (
    <div>
      <button onClick={() => toast.success("Success title", { message: "Success message" })}>
        Add Success
      </button>
      <button onClick={() => toast.error("Error title", { message: "Error message" })}>
        Add Error
      </button>
      <button onClick={() => toast.warning("Warning title")}>
        Add Warning
      </button>
      <button onClick={() => toast.info("Info title")}>
        Add Info
      </button>
      <ToastContainer toasts={toast.toasts} onDismiss={toast.removeToast} />
    </div>
  );
}

function renderWithProvider() {
  return render(
    <ToastProvider>
      <TestHarness />
    </ToastProvider>,
  );
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("ToastProvider and ToastContainer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when no toasts", () => {
    renderWithProvider();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders a success toast", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("Add Success"));
    expect(screen.getByText("Success title")).toBeInTheDocument();
    expect(screen.getByText("Success message")).toBeInTheDocument();
  });

  it("renders an error toast", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("Add Error"));
    expect(screen.getByText("Error title")).toBeInTheDocument();
    expect(screen.getByText("Error message")).toBeInTheDocument();
  });

  it("renders multiple toasts (stacking)", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("Add Success"));
    fireEvent.click(screen.getByText("Add Error"));
    const alerts = screen.getAllByRole("alert");
    expect(alerts.length).toBe(2);
  });

  it("dismisses a toast when close button is clicked", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("Add Success"));
    expect(screen.getByText("Success title")).toBeInTheDocument();
    const dismissBtn = screen.getByLabelText("Dismiss success notification");
    fireEvent.click(dismissBtn);
    expect(screen.queryByText("Success title")).not.toBeInTheDocument();
  });

  it("auto-dismisses after duration", async () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("Add Success"));
    expect(screen.getByText("Success title")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5100);
    });

    // The dismiss timer is a plain setTimeout in ToastProvider, so advancing
    // inside act() removes the toast synchronously. `waitFor` polls on real
    // timers and would simply hang out the clock here.
    expect(screen.queryByText("Success title")).not.toBeInTheDocument();
  });

  it("renders warning and info types", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("Add Warning"));
    fireEvent.click(screen.getByText("Add Info"));
    expect(screen.getByText("Warning title")).toBeInTheDocument();
    expect(screen.getByText("Info title")).toBeInTheDocument();
  });

  it("toasts have role='alert' for screen readers", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("Add Error"));
    const alerts = screen.getAllByRole("alert");
    expect(alerts.length).toBe(1);
  });

  it("toasts have aria-live='assertive'", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("Add Success"));
    const alert = screen.getByRole("alert");
    expect(alert.getAttribute("aria-live")).toBe("assertive");
  });
});
