import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Tooltip } from "./Tooltip";

describe("Tooltip", () => {
  it("is hidden by default", () => {
    render(
      <Tooltip content="Copy address">
        <button>Copy</button>
      </Tooltip>,
    );

    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(screen.queryByText("Copy address")).not.toBeInTheDocument();
  });

  it("shows the tooltip when the trigger receives keyboard focus", async () => {
    render(
      <Tooltip content="Copy address">
        <button>Copy</button>
      </Tooltip>,
    );

    fireEvent.focus(screen.getByRole("button", { name: "Copy" }));

    await waitFor(() => {
      expect(screen.getAllByText("Copy address").length).toBeGreaterThan(0);
    });
  });

  it("hides the tooltip again when focus leaves the trigger", async () => {
    render(
      <Tooltip content="Copy address">
        <button>Copy</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", { name: "Copy" });
    fireEvent.focus(trigger);
    await waitFor(() => {
      expect(screen.getAllByText("Copy address").length).toBeGreaterThan(0);
    });

    fireEvent.blur(trigger);

    await waitFor(() => {
      expect(screen.queryByText("Copy address")).not.toBeInTheDocument();
    });
  });

  it("shows the tooltip on pointer hover", async () => {
    render(
      <Tooltip content="Copy address" delayDuration={0}>
        <button>Copy</button>
      </Tooltip>,
    );

    // Radix opens on pointermove for a mouse pointer, not pointerenter.
    const trigger = screen.getByRole("button", { name: "Copy" });
    fireEvent.pointerMove(trigger, { pointerType: "mouse" });

    await waitFor(() => {
      expect(screen.getAllByText("Copy address").length).toBeGreaterThan(0);
    });
  });

  it("describes the trigger for assistive tech while open", async () => {
    render(
      <Tooltip content="Copy address">
        <button>Copy</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", { name: "Copy" });
    expect(trigger).not.toHaveAttribute("aria-describedby");

    fireEvent.focus(trigger);

    await waitFor(() => {
      expect(trigger).toHaveAttribute("aria-describedby");
    });
  });

  it("respects a controlled open prop", () => {
    render(
      <Tooltip content="Copy address" open>
        <button>Copy</button>
      </Tooltip>,
    );

    expect(screen.getAllByText("Copy address").length).toBeGreaterThan(0);
  });

  it("reports open changes to onOpenChange", async () => {
    const onOpenChange = vi.fn();
    render(
      <Tooltip content="Copy address" onOpenChange={onOpenChange}>
        <button>Copy</button>
      </Tooltip>,
    );

    fireEvent.focus(screen.getByRole("button", { name: "Copy" }));

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });
  });

  it("renders the trigger untouched when there is no content", () => {
    render(
      <Tooltip content="">
        <button>Copy</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", { name: "Copy" });
    expect(trigger).toBeInTheDocument();
    expect(trigger).not.toHaveAttribute("data-state");
  });
});
