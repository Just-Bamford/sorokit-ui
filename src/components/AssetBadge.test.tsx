import { render, screen } from "@testing-library/react";
import { describe, expect,it } from "vitest";

import type { Balance } from "@/lib/client";

import { AssetBadge, AssetPill } from "./AssetBadge";

const nativeBalance: Balance = {
  assetType: "native",
  assetCode: null,
  assetIssuer: null,
  balance: "100",
  balanceFloat: 100,
};

const usdcBalance: Balance = {
  assetType: "credit_alphanum4",
  assetCode: "USDC",
  assetIssuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  balance: "50",
  balanceFloat: 50,
};

const unknownBalance: Balance = {
  assetType: "credit_alphanum12",
  assetCode: "WAVEX",
  assetIssuer: "GBBB4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWNA",
  balance: "10",
  balanceFloat: 10,
};

const lpSharesBalance: Balance = {
  assetType: "liquidity_pool_shares",
  assetCode: undefined,
  assetIssuer: undefined,
  balance: "25",
  balanceFloat: 25,
};

describe("AssetBadge", () => {
  it("renders 'XLM' for native asset type", () => {
    render(<AssetBadge balance={nativeBalance} />);
    expect(screen.getByText("XLM")).toBeInTheDocument();
  });

  it("renders 'Stellar Lumens' sub-label for native when showIssuer is true", () => {
    render(<AssetBadge balance={nativeBalance} showIssuer />);
    expect(screen.getByText("Stellar Lumens")).toBeInTheDocument();
  });

  it("applies teal color class for XLM", () => {
    const { container } = render(<AssetBadge balance={nativeBalance} />);
    const icon = container.querySelector(".text-teal");
    expect(icon).toBeInTheDocument();
  });

  it("renders the asset code for a known asset (USDC)", () => {
    render(<AssetBadge balance={usdcBalance} />);
    expect(screen.getByText("USDC")).toBeInTheDocument();
  });

  it("applies brand color class for USDC", () => {
    const { container } = render(<AssetBadge balance={usdcBalance} />);
    const icon = container.querySelector(".text-brand");
    expect(icon).toBeInTheDocument();
  });

  it("renders the truncated issuer when showIssuer is true", () => {
    render(<AssetBadge balance={usdcBalance} showIssuer />);
    const issuerEl = document.querySelector("[data-address]");
    expect(issuerEl).toBeInTheDocument();
    // Issuer is truncated (not the full key)
    expect(issuerEl?.textContent?.length).toBeLessThan(usdcBalance.assetIssuer!.length);
  });

  it("hides the issuer when showIssuer is false", () => {
    render(<AssetBadge balance={usdcBalance} showIssuer={false} />);
    expect(document.querySelector("[data-address]")).not.toBeInTheDocument();
  });

  it("renders deterministic color for unknown assets (not grey)", () => {
    const { container } = render(<AssetBadge balance={unknownBalance} />);
    const icon = container.querySelector(".bg-surface-2");
    expect(icon).not.toBeInTheDocument();
  });

  it("renders the asset code for an unknown asset", () => {
    render(<AssetBadge balance={unknownBalance} />);
    expect(screen.getByText("WAVEX")).toBeInTheDocument();
  });

  it("renders yXLM with distinct green color", () => {
    const yxlmBalance: Balance = {
      assetType: "credit_alphanum12",
      assetCode: "yXLM",
      assetIssuer: "GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTJGIP5FB4M3US5VM5NGVLYELM",
      balance: "100",
      balanceFloat: 100,
    };
    const { container } = render(<AssetBadge balance={yxlmBalance} />);
    const icon = container.querySelector(".text-green");
    expect(icon).toBeInTheDocument();
  });

  it("renders AQUA with distinct blue color", () => {
    const aquaBalance: Balance = {
      assetType: "credit_alphanum12",
      assetCode: "AQUA",
      assetIssuer: "GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTJGIP5FB4M3US5VM5NGVLYELM",
      balance: "50",
      balanceFloat: 50,
    };
    const { container } = render(<AssetBadge balance={aquaBalance} />);
    const icon = container.querySelector(".text-blue");
    expect(icon).toBeInTheDocument();
  });

  it("renders SHX with distinct pink color", () => {
    const shxBalance: Balance = {
      assetType: "credit_alphanum12",
      assetCode: "SHX",
      assetIssuer: "GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTJGIP5FB4M3US5VM5NGVLYELM",
      balance: "25",
      balanceFloat: 25,
    };
    const { container } = render(<AssetBadge balance={shxBalance} />);
    const icon = container.querySelector(".text-pink");
    expect(icon).toBeInTheDocument();
  });

  it("renders BLND with distinct yellow color", () => {
    const blndBalance: Balance = {
      assetType: "credit_alphanum12",
      assetCode: "BLND",
      assetIssuer: "GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTJGIP5FB4M3US5VM5NGVLYELM",
      balance: "75",
      balanceFloat: 75,
    };
    const { container } = render(<AssetBadge balance={blndBalance} />);
    const icon = container.querySelector(".text-yellow");
    expect(icon).toBeInTheDocument();
  });

  it("assigns consistent colors to unknown assets based on code hash", () => {
    const customBalance1: Balance = {
      assetType: "credit_alphanum12",
      assetCode: "CUSTOM1",
      assetIssuer: "GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTJGIP5FB4M3US5VM5NGVLYELM",
      balance: "10",
      balanceFloat: 10,
    };
    const customBalance2: Balance = {
      assetType: "credit_alphanum12",
      assetCode: "CUSTOM2",
      assetIssuer: "GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTJGIP5FB4M3US5VM5NGVLYELM",
      balance: "20",
      balanceFloat: 20,
    };
    const { container: c1 } = render(<AssetBadge balance={customBalance1} />);
    const { container: c2 } = render(<AssetBadge balance={customBalance2} />);

    const icon1Classes = c1.querySelector(".text-ink")?.parentElement?.className || "";
    const icon2Classes = c2.querySelector(".text-ink")?.parentElement?.className || "";
    expect(icon1Classes).not.toEqual(icon2Classes);
  });

  it("renders 'LP' for liquidity_pool_shares without undefined display", () => {
    const { container } = render(<AssetBadge balance={lpSharesBalance} />);
    expect(screen.getAllByText("LP").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument();
    const icon = container.querySelector(".bg-surface-2.text-ink-2");
    expect(icon).toBeInTheDocument();
    expect(icon?.textContent).toBe("LP");
  });

  it("renders 'Liquidity Pool Shares' sub-label for LP when showIssuer is true", () => {
    render(<AssetBadge balance={lpSharesBalance} showIssuer />);
    expect(screen.getByText("Liquidity Pool Shares")).toBeInTheDocument();
  });
});

describe("AssetPill", () => {
  it("renders the asset code", () => {
    render(<AssetPill assetCode="XLM" />);
    expect(screen.getByText("XLM")).toBeInTheDocument();
  });

  it("applies the teal colour for XLM", () => {
    render(<AssetPill assetCode="XLM" />);
    expect(screen.getByText("XLM")).toHaveClass("text-teal");
  });

  it("applies the brand colour for USDC", () => {
    render(<AssetPill assetCode="USDC" />);
    expect(screen.getByText("USDC")).toHaveClass("text-brand");
  });

  it("uses deterministic color for unknown asset code (not grey)", () => {
    render(<AssetPill assetCode="WAVEX" />);
    const pill = screen.getByText("WAVEX");
    expect(pill).not.toHaveClass("bg-surface-2");
    expect(pill).not.toHaveClass("text-ink-2");
  });

  it("merges a custom className", () => {
    render(<AssetPill assetCode="XLM" className="my-pill" />);
    expect(screen.getByText("XLM")).toHaveClass("my-pill");
  });
});
