import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ErrorBoundary } from "./ErrorBoundary";

const ThrowError = () => {
  throw new Error("Test error!");
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("ErrorBoundary", () => {
  it("renders default fallback when child throws, and resets when try again is clicked", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Expect default fallback UI text
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test error!")).toBeInTheDocument();

    const resetBtn = screen.getByRole("button", { name: /try again/i });
    expect(resetBtn).toBeInTheDocument();

    // Clicking reset should try to re-render the children
    // (It will just throw again because we always throw in ThrowError, but it resets state)
    fireEvent.click(resetBtn);
  });

  it("renders custom fallback prop and passes error and reset function", () => {
    const fallbackSpy = vi.fn().mockImplementation((error, reset) => (
      <div>
        <p>Custom Fallback</p>
        <p>{error.message}</p>
        <button onClick={reset}>Reset Custom</button>
      </div>
    ));

    // Suppress console.error for expected thrown error
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={fallbackSpy}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(fallbackSpy).toHaveBeenCalled();
    expect(screen.getByText("Custom Fallback")).toBeInTheDocument();
    expect(screen.getByText("Test error!")).toBeInTheDocument();

    const resetBtn = screen.getByText("Reset Custom");
    expect(resetBtn).toBeInTheDocument();

    // Reset should be callable and reset the error state (though it will just throw again because we still render ThrowError)
    // but we can verify it doesn't crash.
    fireEvent.click(resetBtn);
  });

  it("calls onError callback with error and info when child throws", () => {
    const onErrorSpy = vi.fn();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary onError={onErrorSpy}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onErrorSpy).toHaveBeenCalled();
    expect(consoleSpy).not.toHaveBeenCalledWith(
      "[sorokit-ui] Uncaught error:",
      expect.any(Error),
      expect.any(String)
    );
    const errorArg = onErrorSpy.mock.calls[0][0];
    const infoArg = onErrorSpy.mock.calls[0][1];

    expect(errorArg).toBeInstanceOf(Error);
    expect(errorArg.message).toBe("Test error!");
    expect(infoArg).toHaveProperty("componentStack");
  });

  it("does not call console.error in production mode", () => {
    vi.stubEnv("DEV", false);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(consoleSpy).not.toHaveBeenCalledWith(
      "[sorokit-ui] Uncaught error:",
      expect.any(Error),
      expect.any(String)
    );
  });

  it("calls onError instead of console.error in production mode when provided", () => {
    vi.stubEnv("DEV", false);
    const onErrorSpy = vi.fn();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary onError={onErrorSpy}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(consoleSpy).not.toHaveBeenCalledWith(
      "[sorokit-ui] Uncaught error:",
      expect.any(Error),
      expect.any(String)
    );
    expect(onErrorSpy).toHaveBeenCalled();
  });

  it("calls console.error in development mode by default", () => {
    vi.stubEnv("DEV", true);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[sorokit-ui] Uncaught error:",
      expect.any(Error),
      expect.any(String)
    );
  });

  it("reset key remounts children with fresh state to avoid an error loop", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    let shouldRecoverAfterReset = false;

    const TestComponent = () => {
      if (!shouldRecoverAfterReset) {
        throw new Error("Corrupted child state");
      }

      return <div data-testid="test-content">Mounted successfully</div>;
    };

    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    const resetBtn = screen.getByRole("button", { name: /try again/i });
    shouldRecoverAfterReset = true;
    fireEvent.click(resetBtn);

    expect(screen.getByTestId("test-content")).toBeInTheDocument();
    expect(screen.getByText("Mounted successfully")).toBeInTheDocument();
  });

  it("calls onRetry when the user clicks try again", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onRetry = vi.fn();

    render(
      <ErrorBoundary onRetry={onRetry}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onRetry).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("calls onRetry from a custom fallback's reset callback", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onRetry = vi.fn();

    render(
      <ErrorBoundary
        onRetry={onRetry}
        fallback={(_error, reset) => (
          <button onClick={reset}>Reset Custom</button>
        )}
      >
        <ThrowError />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText("Reset Custom"));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("runs onRetry before children re-mount so the retry uses fresh state", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    let clientReady = false;
    const reinitialise = vi.fn(() => {
      clientReady = true;
    });

    const NeedsClient = () => {
      if (!clientReady) throw new Error("Client not initialized");
      return <div data-testid="ready">Client ready</div>;
    };

    render(
      <ErrorBoundary onRetry={reinitialise}>
        <NeedsClient />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(reinitialise).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("ready")).toBeInTheDocument();
  });

  it("applies scoped container styling when isolate is true", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { container } = render(
      <ErrorBoundary isolate>
        <ThrowError />
      </ErrorBoundary>
    );

    const scopedFallback = container.firstElementChild;

    expect(scopedFallback).toHaveClass("overflow-hidden");
    expect(scopedFallback).toHaveClass("rounded-xl");
    expect(scopedFallback).toHaveClass("border");
    expect(scopedFallback).toHaveClass("min-h-[260px]");
  });

  describe("supportUrl link (#332)", () => {
    it("renders a 'Report this issue' link when supportUrl is provided", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});

      render(
        <ErrorBoundary supportUrl="https://github.com/Sorokit/ui/issues">
          <ThrowError />
        </ErrorBoundary>
      );

      const link = screen.getByRole("link", { name: /report this issue/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "https://github.com/Sorokit/ui/issues");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("does not render a 'Report this issue' link when supportUrl is not provided", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.queryByRole("link", { name: /report this issue/i })).not.toBeInTheDocument();
    });
  });

  describe("dev-mode component stack (#332)", () => {
    it("shows the component stack in a <details> element in dev mode", () => {
      vi.stubEnv("DEV", true);
      vi.spyOn(console, "error").mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const details = screen.getByText("Show component stack").closest("details");
      expect(details).toBeInTheDocument();
      const pre = details!.querySelector("pre");
      expect(pre).toBeInTheDocument();
      expect(pre!.textContent).toContain("ThrowError");
    });

    it("does not show the component stack in production mode", () => {
      vi.stubEnv("DEV", false);
      vi.spyOn(console, "error").mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.queryByText("Show component stack")).not.toBeInTheDocument();
    });
  });
});
