import { render, screen } from "@testing-library/react";
import { describe, expect,it } from "vitest";

import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("does not set live-region attributes by default", () => {
    render(<Badge>Static</Badge>);
    const badge = screen.getByText("Static");
    expect(badge).not.toHaveAttribute("role", "status");
    expect(badge).not.toHaveAttribute("aria-live");
  });

  it("exposes a polite live region when live is set", () => {
    render(<Badge live>Updating</Badge>);
    const badge = screen.getByText("Updating");
    expect(badge).toHaveAttribute("role", "status");
    expect(badge).toHaveAttribute("aria-live", "polite");
  });

  it("hides the status dot from assistive tech", () => {
    const { container } = render(
      <Badge dot live>
        Live
      </Badge>,
    );
    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).toBeInTheDocument();
  });

  it("applies smaller font and padding for size sm", () => {
    const { container } = render(<Badge size="sm">Small</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("text-[10px]");
    expect(badge.className).toContain("px-1.5");
    expect(badge.className).toContain("py-0.5");
  });

  it("applies default font and padding for size md", () => {
    const { container } = render(<Badge size="md">Medium</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("text-[11px]");
    expect(badge.className).toContain("px-2");
    expect(badge.className).toContain("py-1");
  });

  it("defaults to md size when size is not specified", () => {
    const { container } = render(<Badge>Default</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("text-[11px]");
    expect(badge.className).toContain("px-2");
  });

  it("applies purple styling for primary variant", () => {
    const { container } = render(<Badge variant="primary">Primary</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-brand-dim");
    expect(badge.className).toContain("text-brand");
    expect(badge.className).not.toContain("teal");
  });

  it("renders a standalone indicator dot when no children provided", () => {
    const { container } = render(<Badge dot />);
    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).toBeInTheDocument();
    expect(dot?.className).toContain("w-1");
    expect(dot?.className).toContain("h-1");
    expect(dot?.className).toContain("rounded-full");
    expect(container.firstChild?.textContent).toBe("");
  });

  describe("dot without children", () => {
    it("drops the pill chrome so the dot does not sit in a collapsed pill", () => {
      const { container } = render(<Badge dot />);
      const badge = container.firstChild as HTMLElement;

      expect(badge.className).not.toContain("px-2");
      expect(badge.className).not.toContain("py-1");
      expect(badge.className).not.toContain("rounded-full px-");
      expect(badge.className).not.toContain("border");
      expect(badge.className).not.toContain("bg-surface-2");
    });

    it("keeps the pill chrome when children are present", () => {
      const { container } = render(<Badge dot>Live</Badge>);
      const badge = container.firstChild as HTMLElement;

      expect(badge.className).toContain("px-2");
      expect(badge.className).toContain("py-1");
      expect(badge.className).toContain("border");
    });

    it("treats an empty string child as no children", () => {
      const { container } = render(<Badge dot>{""}</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).not.toContain("px-2");
    });

    it("uses the variant's dot colour when standalone", () => {
      const { container } = render(<Badge dot variant="success" />);
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot?.className).toContain("bg-green");
    });

    it("still exposes a live region when live is set", () => {
      const { container } = render(<Badge dot live />);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveAttribute("role", "status");
      expect(badge).toHaveAttribute("aria-live", "polite");
    });

    it("forwards className and other props when standalone", () => {
      const { container } = render(
        <Badge dot className="my-dot" data-testid="standalone" />,
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("my-dot");
      expect(badge).toHaveAttribute("data-testid", "standalone");
    });
  });
});
