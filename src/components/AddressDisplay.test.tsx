import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { AddressDisplay } from "./AddressDisplay";

const mockWriteText = vi.fn().mockResolvedValue(undefined);
beforeAll(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: mockWriteText },
    configurable: true,
    writable: true,
  });
});

beforeEach(() => {
  mockWriteText.mockClear();
});

describe("AddressDisplay", () => {
  const address = "GBAMQXTQ7IQKPZXJKZJQZJQZJQZJQZJQZJQZJQZJQZJQZJQZJQZJQQQQ";

  describe("basic render", () => {
    it("renders truncated address and copy button with correct aria-label", async () => {
      render(<AddressDisplay address={address} />);
      expect(screen.getByText("GBAMQXTQ...ZJQQQQ")).toBeInTheDocument();
      const copyBtn = screen.getByRole("button", { name: "Copy address to clipboard" });
      expect(copyBtn).toBeInTheDocument();
      expect(copyBtn).not.toHaveAttribute("tabindex", "-1");
      await act(async () => { fireEvent.click(copyBtn); });
      expect(mockWriteText).toHaveBeenCalledWith(address);
      expect(screen.getByRole("button", { name: "Address copied" })).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Copy address to clipboard" })).toBeInTheDocument();
      }, { timeout: 2500 });
    });

    it("applies base opacity-50 to copy button", () => {
      render(<AddressDisplay address={address} />);
      const copyBtn = screen.getByRole("button", { name: "Copy address to clipboard" });
      expect(copyBtn.className).toContain("opacity-50");
      expect(copyBtn.className).not.toContain("opacity-0");
    });
  });

  describe("showFull prop", () => {
    it("renders the full address and applies select-all class", () => {
      render(<AddressDisplay address={address} showFull />);
      const el = screen.getByText(address);
      expect(el).toBeInTheDocument();
      expect(el.className).toContain("select-all");
    });

    it("does not add select-all when showFull is false", () => {
      render(<AddressDisplay address={address} />);
      const el = screen.getByText("GBAMQXTQ...ZJQQQQ");
      expect(el.className).not.toContain("select-all");
    });
  });

  describe("onCopy callback", () => {
    it("fires after successful clipboard write", async () => {
      const onCopy = vi.fn();
      render(<AddressDisplay address={address} onCopy={onCopy} />);
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Copy address to clipboard" })); });
      expect(onCopy).toHaveBeenCalled();
    });
  });

  describe("masked prop", () => {
    it("shows GBAM···QQQQ format when masked is true", () => {
      render(<AddressDisplay address={address} masked />);
      expect(screen.getByText("GBAM···QQQQ")).toBeInTheDocument();
    });

    it("does not show masked format by default", () => {
      render(<AddressDisplay address={address} />);
      expect(screen.queryByText("GBAM···QQQQ")).not.toBeInTheDocument();
      expect(screen.getByText("GBAMQXTQ...ZJQQQQ")).toBeInTheDocument();
    });
  });

  describe("mono prop", () => {
    it("applies font-mono class when mono is true", () => {
      render(<AddressDisplay address={address} mono />);
      const el = screen.getByText("GBAMQXTQ...ZJQQQQ");
      expect(el.className).toContain("font-mono");
    });

    it("does not apply font-mono by default", () => {
      render(<AddressDisplay address={address} />);
      const el = screen.getByText("GBAMQXTQ...ZJQQQQ");
      expect(el.className).not.toContain("font-mono");
    });
  });

  describe("label prop / dl/dt/dd structure", () => {
    it("renders label as dt inside a dl when label prop is provided", () => {
      const { container } = render(<AddressDisplay address={address} label="Destination" />);
      const dl = container.querySelector("dl");
      expect(dl).toBeInTheDocument();
      const dt = dl!.querySelector("dt");
      expect(dt).toHaveTextContent("Destination");
      const dd = dl!.querySelector("dd");
      expect(dd).toBeInTheDocument();
    });

    it("renders without dl/dt when label is not provided", () => {
      const { container } = render(<AddressDisplay address={address} />);
      expect(container.querySelector("dl")).not.toBeInTheDocument();
      expect(container.querySelector("dt")).not.toBeInTheDocument();
    });
  });

  describe("size prop", () => {
    it("applies text-[10px] for sm size", () => {
      render(<AddressDisplay address={address} showFull size="sm" />);
      expect(screen.getByText(address).className).toContain("text-[10px]");
    });

    it("applies text-[11px] for md size (default)", () => {
      render(<AddressDisplay address={address} showFull />);
      expect(screen.getByText(address).className).toContain("text-[11px]");
    });

    it("applies text-[13px] for lg size", () => {
      render(<AddressDisplay address={address} showFull size="lg" />);
      expect(screen.getByText(address).className).toContain("text-[13px]");
    });
  });

  describe("custom start/end", () => {
    it("truncates with custom start and end values", () => {
      render(<AddressDisplay address={address} start={4} end={4} />);
      expect(screen.getByText("GBAM...QQQQ")).toBeInTheDocument();
    });
  });

  describe("masked + mono combination", () => {
    it("applies font-mono and shows masked format when both are true", () => {
      render(<AddressDisplay address={address} masked mono />);
      const el = screen.getByText("GBAM···QQQQ");
      expect(el).toBeInTheDocument();
      expect(el.className).toContain("font-mono");
    });
  });

  it("renders the masked 4-prefix + middot + 4-suffix form when masked is true", () => {
    const { container } = render(<AddressDisplay address={address} masked />);
    const el = container.querySelector("[data-address]") as HTMLElement;
    expect(el.textContent).toMatch(/^GBAM.+QQQQ$/);
    expect(el.textContent?.length ?? 0).toBeLessThan(address.length);
    // The truncated middle chunk should not appear when masked is on.
    expect(el.textContent).not.toContain("QXTQ");
  });

  it("applies font-mono class when mono prop is true", () => {
    render(<AddressDisplay address={address} mono />);
    const el = screen.getByText(/GBAMQXTQ/);
    expect(el.className).toContain("font-mono");
  });

  it("does not apply font-mono class by default", () => {
    render(<AddressDisplay address={address} />);
    const el = screen.getByText(/GBAMQXTQ/);
    expect(el.className).not.toContain("font-mono");
  });

  it("renders <dl>/<dt>/<dd> structure when label is provided", () => {
    const { container } = render(<AddressDisplay address={address} label="Source" />);
    expect(container.querySelector("dl")).toBeInTheDocument();
    const dt = container.querySelector("dt");
    expect(dt).toHaveTextContent("Source");
    expect(dt?.tagName).toBe("DT");
    const dd = container.querySelector("dd");
    expect(dd).toBeInTheDocument();
    expect(dd?.tagName).toBe("DD");
    // The <dd> wraps the address span, so the addressSpan ends up under it.
    expect(dd?.querySelector("[data-address]")).not.toBeNull();
  });

  it("does not render <dl> when label is omitted", () => {
    const { container } = render(<AddressDisplay address={address} />);
    expect(container.querySelector("dl")).toBeNull();
    expect(container.querySelector("dt")).toBeNull();
    expect(container.querySelector("dd")).toBeNull();
  });

  describe("non-secure context fallback (#534)", () => {
    it("falls back to execCommand when navigator.clipboard is undefined", async () => {
      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        configurable: true,
        writable: true,
      });
      const execCommand = vi.fn().mockReturnValue(true);
      document.execCommand = execCommand;

      const onCopy = vi.fn();
      render(<AddressDisplay address={address} onCopy={onCopy} />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Copy address to clipboard" }));
      });

      expect(execCommand).toHaveBeenCalledWith("copy");
      expect(onCopy).toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Address copied" })).toBeInTheDocument();

      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: mockWriteText },
        configurable: true,
        writable: true,
      });
    });

    it("falls back to execCommand when navigator.clipboard.writeText rejects", async () => {
      mockWriteText.mockRejectedValueOnce(new Error("not a secure context"));
      const execCommand = vi.fn().mockReturnValue(true);
      document.execCommand = execCommand;

      render(<AddressDisplay address={address} />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Copy address to clipboard" }));
      });

      expect(execCommand).toHaveBeenCalledWith("copy");
      expect(screen.getByRole("button", { name: "Address copied" })).toBeInTheDocument();
    });

    it("shows a visible failure indicator for at least 1.5s when both copy methods fail", async () => {
      vi.useFakeTimers();
      mockWriteText.mockRejectedValueOnce(new Error("denied"));
      document.execCommand = vi.fn().mockReturnValue(false);

      render(<AddressDisplay address={address} />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Copy address to clipboard" }));
      });

      expect(
        screen.getByRole("button", { name: "Failed to copy address" }),
      ).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1400);
      });
      expect(
        screen.getByRole("button", { name: "Failed to copy address" }),
      ).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(
        screen.getByRole("button", { name: "Copy address to clipboard" }),
      ).toBeInTheDocument();

      vi.useRealTimers();
    });

    it("does not call onCopy when both copy methods fail", async () => {
      mockWriteText.mockRejectedValueOnce(new Error("denied"));
      document.execCommand = vi.fn().mockReturnValue(false);
      const onCopy = vi.fn();

      render(<AddressDisplay address={address} onCopy={onCopy} />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Copy address to clipboard" }));
      });

      expect(onCopy).not.toHaveBeenCalled();
    });
  });
});
