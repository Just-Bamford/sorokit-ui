import { describe, expect, it } from "vitest";

import { getExplorerUrl, truncateAddress } from "./utils";

describe("truncateAddress", () => {
  it("truncates standard ASCII strings correctly", () => {
    expect(truncateAddress("GA2C5RFPE6GCKIG3EQZ52V2Q4CQA2F4D5CFAOKL3TFRGZJ6A6K", 6, 4)).toBe("GA2C5R...6A6K");
  });

  it("returns the original string if it is shorter or equal to start + end length", () => {
    expect(truncateAddress("1234567890", 6, 4)).toBe("1234567890");
    expect(truncateAddress("123456789", 6, 4)).toBe("123456789");
  });

  it("returns empty string for empty input", () => {
    expect(truncateAddress("")).toBe("");
  });

  it("handles single-character strings", () => {
    expect(truncateAddress("A")).toBe("A");
  });

  it("safely truncates mixed unicode and emoji strings", () => {
    // 12 chars: "👋🌍🌞🌙⭐🌟🌠💫✨☄️🔥💧"
    const emojis = "👋🌍🌞🌙⭐🌟🌠💫✨☄️🔥💧";
    expect(truncateAddress(emojis, 3, 2)).toBe("👋🌍🌞...🔥💧");
  });

  it("handles multi-codepoint emoji sequences without splitting surrogates", () => {
    // Family emoji is a multi-codepoint ZWJ sequence (treated as one visible glyph
    // but Array.from splits at codepoint boundaries — this verifies that behaviour)
    const family = "👨‍👩‍👧‍👦";
    const long = family.repeat(3) + "A".repeat(10);
    const result = truncateAddress(long, 2, 1);
    // Should not throw and should contain "..."
    expect(result).toContain("...");
  });

  it("truncates a full 56-char Stellar address with default start/end", () => {
    const address = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWNA";
    expect(address).toHaveLength(56);
    const result = truncateAddress(address);
    expect(result).toBe("GAAZI4...CWNA");
    expect(result.length).toBeLessThan(address.length);
  });

  it("truncates a 56-char Soroban contract ID the same way as addresses", () => {
    const contractId = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHK3M";
    expect(contractId).toHaveLength(56);
    expect(contractId.startsWith("C")).toBe(true);
    expect(truncateAddress(contractId, 10, 6)).toBe("CAAAAAAAAA...AAHK3M");
  });

  it("uses the provided start and end parameters", () => {
    const address = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWNA";
    expect(truncateAddress(address, 8, 6)).toBe("GAAZI4TC...OCCWNA");
  });

  it("returns full string when exactly at start + end boundary", () => {
    expect(truncateAddress("ABCDEFGHIJ", 5, 5)).toBe("ABCDEFGHIJ");
  });

  it("handles null-like falsy input gracefully", () => {
    expect(truncateAddress("" as string)).toBe("");
  });
});

describe("getExplorerUrl", () => {
  const TX_HASH =
    "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

  it("returns the mainnet Stellar Expert URL for mainnet", () => {
    expect(getExplorerUrl("mainnet", TX_HASH)).toBe(
      `https://stellar.expert/explorer/public/tx/${TX_HASH}`,
    );
  });

  it("returns the testnet Stellar Expert URL for testnet", () => {
    expect(getExplorerUrl("testnet", TX_HASH)).toBe(
      `https://stellar.expert/explorer/testnet/tx/${TX_HASH}`,
    );
  });

  it("returns null for futurenet (no Stellar Expert support)", () => {
    expect(getExplorerUrl("futurenet", TX_HASH)).toBeNull();
  });

  it("returns null for localnet", () => {
    expect(getExplorerUrl("localnet", TX_HASH)).toBeNull();
  });

  it("returns null for custom network names", () => {
    expect(getExplorerUrl("customnet", TX_HASH)).toBeNull();
  });

  it("returns null when networkName is undefined", () => {
    expect(getExplorerUrl(undefined, TX_HASH)).toBeNull();
  });

  it("returns null when networkName is null", () => {
    expect(getExplorerUrl(null, TX_HASH)).toBeNull();
  });
});
