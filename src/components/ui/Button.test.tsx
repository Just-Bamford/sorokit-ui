import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Button, ButtonGroup } from "./Button";

describe("Button", () => {
  it("renders children correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("renders a loading spinner when loading is true", () => {
    const { container } = render(<Button loading>Submit</Button>);
    // When loading, the sr-only "Loading" text is prepended to accessible name
    expect(screen.getByRole("button", { name: "LoadingSubmit" })).toBeInTheDocument();
    // The spinner is a span with animate-spin class
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Click me</Button>);
    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toBeDisabled();
    expect(button.className).toContain("disabled:opacity-40");
  });

  it("is disabled when loading is true", () => {
    render(<Button loading>Submit</Button>);
    // When loading, the sr-only "Loading" text is prepended to accessible name
    const button = screen.getByRole("button", { name: "LoadingSubmit" });
    expect(button).toBeDisabled();
  });

  it("applies primary variant by default", () => {
    render(<Button>Button</Button>);
    const button = screen.getByRole("button", { name: "Button" });
    expect(button.className).toContain("bg-brand");
    expect(button.className).toContain("text-white");
  });

  it("applies secondary variant classes", () => {
    render(<Button variant="secondary">Button</Button>);
    const button = screen.getByRole("button", { name: "Button" });
    expect(button.className).toContain("border");
    expect(button.className).toContain("border-line-2");
  });

  it("applies ghost variant classes", () => {
    render(<Button variant="ghost">Button</Button>);
    const button = screen.getByRole("button", { name: "Button" });
    expect(button.className).toContain("text-ink-2");
  });

  it("applies destructive variant classes", () => {
    render(<Button variant="destructive">Button</Button>);
    const button = screen.getByRole("button", { name: "Button" });
    expect(button.className).toContain("bg-error-dim");
    expect(button.className).toContain("text-red");
  });

  it("applies sm size classes", () => {
    render(<Button size="sm">Button</Button>);
    const button = screen.getByRole("button", { name: "Button" });
    expect(button.className).toContain("h-8");
  });

  it("applies md size classes by default", () => {
    render(<Button>Button</Button>);
    const button = screen.getByRole("button", { name: "Button" });
    expect(button.className).toContain("h-9");
  });

  it("applies lg size classes", () => {
    render(<Button size="lg">Button</Button>);
    const button = screen.getByRole("button", { name: "Button" });
    expect(button.className).toContain("h-10");
  });

  it("keeps the label visible while loading", () => {
    render(<Button loading>Send</Button>);
    const button = screen.getByRole("button", { name: /Send/ });
    expect(button).toHaveTextContent("Send");
  });

  it("applies square icon-only sizing with no horizontal padding", () => {
    render(
      <Button iconOnly aria-label="Refresh">
        <svg />
      </Button>
    );
    const button = screen.getByRole("button", { name: "Refresh" });
    expect(button.className).toContain("w-9");
    expect(button.className).toContain("h-9");
    expect(button.className).not.toContain("px-4");
  });

  it("shows the spinner in place of the icon for iconOnly loading", () => {
    const { container } = render(
      <Button iconOnly loading aria-label="Refresh">
        <svg data-testid="icon" />
      </Button>
    );
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.queryByTestId("icon")).not.toBeInTheDocument();
  });

  it("requires two clicks when requireConfirm is set", () => {
    const onClick = vi.fn();
    render(
      <Button requireConfirm confirmLabel="Are you sure?" onClick={onClick}>
        Delete
      </Button>
    );
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(button).toHaveTextContent("Are you sure?");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("resets the confirmation prompt on blur", () => {
    render(
      <Button requireConfirm confirmLabel="Are you sure?">
        Delete
      </Button>
    );
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(button).toHaveTextContent("Are you sure?");
    fireEvent.blur(button);
    expect(button).toHaveTextContent("Delete");
  });

  it("supports rendering as a child (asChild prop)", () => {
    const { container } = render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    const link = container.querySelector("a");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/test");
    expect(link?.className).toContain("bg-brand"); // variant styles are transferred
  });

  it("renders leftIcon before the label", () => {
    render(
      <Button leftIcon={<svg data-testid="left" />}>Send</Button>
    );
    const button = screen.getByRole("button", { name: "Send" });
    const icon = screen.getByTestId("left");
    expect(button).toContainElement(icon);
    // The icon precedes the label in document order.
    expect(button.firstElementChild).toContainElement(icon);
  });

  it("renders rightIcon after the label", () => {
    render(
      <Button rightIcon={<svg data-testid="right" />}>Next</Button>
    );
    const button = screen.getByRole("button", { name: "Next" });
    const icon = screen.getByTestId("right");
    expect(button).toContainElement(icon);
    expect(button.lastElementChild).toContainElement(icon);
  });

  it("sizes the icon slot to match the button size", () => {
    const { container, rerender } = render(
      <Button size="sm" leftIcon={<svg />}>Send</Button>
    );
    expect(container.querySelector("span.w-3\\.5")).toBeInTheDocument();

    rerender(<Button size="lg" leftIcon={<svg />}>Send</Button>);
    expect(container.querySelector('span[class*="w-[18px]"]')).toBeInTheDocument();
  });

  it("renders both icons alongside the label", () => {
    render(
      <Button leftIcon={<svg data-testid="left" />} rightIcon={<svg data-testid="right" />}>
        Both
      </Button>
    );
    expect(screen.getByTestId("left")).toBeInTheDocument();
    expect(screen.getByTestId("right")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveTextContent("Both");
  });

  it("keeps the spinner in the leading slot instead of leftIcon while loading", () => {
    const { container } = render(
      <Button loading leftIcon={<svg data-testid="left" />}>Send</Button>
    );
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.queryByTestId("left")).not.toBeInTheDocument();
  });

  it("renders an anchor with safe rel attributes when href is provided", () => {
    render(<Button href="https://stellar.expert">View on Stellar Expert</Button>);
    const link = screen.getByRole("link", { name: "View on Stellar Expert" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "https://stellar.expert");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link.className).toContain("bg-brand");
  });

  it("disables the href anchor when disabled is true", () => {
    const onClick = vi.fn();
    const { container } = render(
      <Button href="https://stellar.expert" disabled onClick={onClick}>
        View
      </Button>
    );
    const link = container.querySelector("a")!;
    expect(link).toHaveAttribute("aria-disabled", "true");
    // href is dropped so the anchor is neither focusable nor navigable.
    expect(link).not.toHaveAttribute("href");
    fireEvent.click(link);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("fires onClick for an enabled href anchor", () => {
    const onClick = vi.fn();
    render(
      <Button href="https://stellar.expert" onClick={onClick}>
        View
      </Button>
    );
    fireEvent.click(screen.getByRole("link", { name: "View" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("prefers asChild over href when both are given", () => {
    const { container } = render(
      <Button asChild href="https://example.com">
        <a href="/internal">Internal</a>
      </Button>
    );
    expect(container.querySelector("a")).toHaveAttribute("href", "/internal");
    expect(container.querySelector("a")).not.toHaveAttribute("target");
  });
});

describe("Button — re-submission guard and spinner accessibility", () => {
  it("hides the spinner from assistive tech", () => {
    const { container } = render(<Button loading>Submit</Button>);
    const spinner = container.querySelector(".animate-spin");

    expect(spinner).toHaveAttribute("aria-hidden", "true");
  });

  it("announces loading through sr-only text rather than the spinner", () => {
    render(<Button loading>Submit</Button>);

    expect(screen.getByText("Loading")).toHaveClass("sr-only");
  });

  it("marks the button busy while loading", () => {
    render(<Button loading>Submit</Button>);

    expect(screen.getByRole("button", { name: "LoadingSubmit" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("does not re-submit when Enter is pressed on a loading submit button", () => {
    const submit = vi.fn((e: React.FormEvent) => e.preventDefault());

    render(
      <form onSubmit={submit}>
        <input aria-label="amount" />
        <Button type="submit" loading>
          Send
        </Button>
      </form>,
    );

    // A disabled submit button must not be treated as the form's default
    // button, so Enter in a field cannot fire another submit.
    fireEvent.keyDown(screen.getByLabelText("amount"), { key: "Enter" });
    fireEvent.keyPress(screen.getByLabelText("amount"), {
      key: "Enter",
      code: "Enter",
      charCode: 13,
    });

    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "LoadingSend" })).toBeDisabled();
  });

  it("does not fire onClick when Enter activates a loading button", () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Send
      </Button>,
    );

    const button = screen.getByRole("button", { name: "LoadingSend" });
    fireEvent.keyDown(button, { key: "Enter" });
    // Keyboard activation of a button surfaces as a click event.
    fireEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not fire onClick when Enter activates a disabled button", () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Send
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Send" });
    fireEvent.keyDown(button, { key: "Enter" });
    fireEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });

  it("still fires onClick once the button is no longer loading", () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <Button loading onClick={onClick}>
        Send
      </Button>,
    );

    fireEvent.click(screen.getByRole("button", { name: "LoadingSend" }));
    expect(onClick).not.toHaveBeenCalled();

    rerender(<Button onClick={onClick}>Send</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("Button — loading width lock", () => {
  it("locks the button width when transitioning to loading so the layout does not jump", () => {
    const { rerender, container } = render(
      <Button>Connect Wallet</Button>,
    );
    const btn = container.querySelector("button")!;

    // Simulate a known rendered width.
    Object.defineProperty(btn, "offsetWidth", {
      value: 140,
      writable: true,
    });

    // Transition to loading with a longer label.
    rerender(<Button loading>Connecting…</Button>);

    const loadingBtn = container.querySelector("button")!;
    expect(loadingBtn.style.minWidth).toBe("140px");
  });

  it("releases the width lock once loading ends", () => {
    const { rerender, container } = render(
      <Button loading>Connecting…</Button>,
    );

    // Transition out of loading.
    rerender(<Button>Connect Wallet</Button>);

    const btn = container.querySelector("button")!;
    expect(btn.style.minWidth).toBe("");
  });

  it("merges the locked minWidth with any user-specified style", () => {
    const { rerender, container } = render(
      <Button style={{ color: "red" }}>Connect Wallet</Button>,
    );
    const btn = container.querySelector("button")!;

    Object.defineProperty(btn, "offsetWidth", {
      value: 140,
      writable: true,
    });

    rerender(<Button loading style={{ color: "red" }}>Connecting…</Button>);

    const loadingBtn = container.querySelector("button")!;
    expect(loadingBtn.style.minWidth).toBe("140px");
    expect(loadingBtn.style.color).toBe("red");
  });

  it("applies the width lock to all variants", () => {
    for (const variant of ["primary", "secondary", "ghost", "destructive"] as const) {
      const { rerender, container } = render(
        <Button variant={variant}>Connect Wallet</Button>,
      );
      const btn = container.querySelector("button")!;

      Object.defineProperty(btn, "offsetWidth", {
        value: 140,
        writable: true,
      });

      rerender(<Button variant={variant} loading>Connecting…</Button>);

      expect(container.querySelector("button")!.style.minWidth).toBe("140px");
    }
  });
});

describe("ButtonGroup", () => {
  it("renders its children inside a group role", () => {
    render(
      <ButtonGroup>
        <Button>Prev</Button>
        <Button>Next</Button>
      </ButtonGroup>
    );
    const group = screen.getByRole("group");
    expect(group).toContainElement(screen.getByRole("button", { name: "Prev" }));
    expect(group).toContainElement(screen.getByRole("button", { name: "Next" }));
  });

  it("collapses the shared border radius horizontally by default", () => {
    render(
      <ButtonGroup>
        <Button>Prev</Button>
        <Button>Next</Button>
      </ButtonGroup>
    );
    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("data-orientation", "horizontal");
    expect(group.className).toContain("flex-row");
    // The shared radius is collapsed through child-combinator selectors so the
    // buttons read as one connected control: non-first siblings lose the left
    // radius, non-last siblings lose the right radius.
    expect(group.className).toContain("[&>*:not(:first-child)]:rounded-l-none");
    expect(group.className).toContain("[&>*:not(:last-child)]:rounded-r-none");
  });

  it("collapses the shared border radius vertically", () => {
    render(
      <ButtonGroup orientation="vertical">
        <Button>Top</Button>
        <Button>Bottom</Button>
      </ButtonGroup>
    );
    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("data-orientation", "vertical");
    expect(group.className).toContain("flex-col");
    // Non-first buttons drop the top radius, non-last buttons drop the bottom.
    expect(group.className).toContain("[&>*:not(:first-child)]:rounded-t-none");
    expect(group.className).toContain("[&>*:not(:last-child)]:rounded-b-none");
  });

  it("merges a custom className", () => {
    render(
      <ButtonGroup className="my-group">
        <Button>Only</Button>
      </ButtonGroup>
    );
    expect(screen.getByRole("group")).toHaveClass("my-group");
  });
});
