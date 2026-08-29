import { fireEvent,render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChartingScreen } from "./ChartingScreen";

describe("ChartingScreen", () => {
  it("renders Charting Screen heading and price feed", () => {
    render(<ChartingScreen />);
    expect(screen.getByText("Advanced Charting")).toBeInTheDocument();
    expect(screen.getByText("Live Feed")).toBeInTheDocument();
  });

  it("allows selecting timeframe and toggling chart type", () => {
    render(<ChartingScreen />);
    
    // Switch timeframe
    const tfBtn = screen.getByRole("button", { name: "15m" });
    fireEvent.click(tfBtn);
    expect(screen.getByText(/Rendering candlestick chart \(15m\)/i)).toBeInTheDocument();

    // Toggle Chart Type
    const lineBtn = screen.getByRole("button", { name: "Line Chart" });
    fireEvent.click(lineBtn);
    expect(screen.getByText(/Rendering line chart \(15m\)/i)).toBeInTheDocument();
  });

  it("can toggle technical indicators", () => {
    render(<ChartingScreen />);
    
    // Default SMA should be On
    expect(screen.getByText("SMA Overlay")).toBeInTheDocument();

    // Toggle Bollinger Bands On
    const bbBtn = screen.getByRole("button", { name: /BOLLINGER/i });
    fireEvent.click(bbBtn);
    expect(screen.getByText("Bollinger Envelopes")).toBeInTheDocument();
  });

  it("can manage price alerts", () => {
    render(<ChartingScreen />);
    
    const input = screen.getByPlaceholderText(/Price e.g. 0.11/i);
    const submitBtn = screen.getByRole("button", { name: "Create Alert" });

    fireEvent.change(input, { target: { value: "0.155" } });
    fireEvent.click(submitBtn);

    expect(screen.getByText("$0.155")).toBeInTheDocument();
  });
});
