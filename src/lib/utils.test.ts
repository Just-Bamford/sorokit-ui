import { describe, expect, it } from "vitest";

import { cn, truncateAddress } from "./utils";

describe("truncateAddress", () => {
  const STELLAR_ADDRESS_56 =
    "GABCDEF123456789012345678901234567890123456789012345WXYZ";

  it("truncates a 56-char Stellar address with default params (start=6, end=4)", () => {
    // 56 characters total -> start 6 chars ("GABCDE"), end 4 chars ("WXYZ")
    const result = truncateAddress(STELLAR_ADDRESS_56);
    expect(result).toBe("GABCDE...WXYZ");
    expect(result.startsWith("GABCDE")).toBe(true);
    expect(result.endsWith("WXYZ")).toBe(true);
  });

  it("truncates with custom start/end values (14, 6) as used in WalletScreen", () => {
    const result = truncateAddress(STELLAR_ADDRESS_56, 14, 6);
    expect(result).toBe("GABCDEF1234567...45WXYZ");
  });

  it("returns an empty string when given an empty string", () => {
    expect(truncateAddress("")).toBe("");
  });

  it("returns an empty string when given null or undefined", () => {
    expect(truncateAddress(null)).toBe("");
    expect(truncateAddress(undefined)).toBe("");
  });

  it("does not throw and returns full string when input length is shorter than or equal to start + end", () => {
    const shortAddress = "GABC";
    expect(() => truncateAddress(shortAddress, 6, 4)).not.toThrow();
    expect(truncateAddress(shortAddress, 6, 4)).toBe("GABC");

    const exactLength = "1234567890"; // 10 chars, equal to start=6 + end=4
    expect(truncateAddress(exactLength, 6, 4)).toBe("1234567890");
  });

  it("handles strings shorter than start + end + 3 without throwing", () => {
    const elevenCharString = "12345678901"; // 11 chars (start+end=10, start+end+3=13)
    expect(() => truncateAddress(elevenCharString, 6, 4)).not.toThrow();
    expect(truncateAddress(elevenCharString, 6, 4)).toBe("123456...8901");
  });
});

describe("cn utility", () => {
  it("correctly merges conflicting Tailwind classes", () => {
    const result = cn("bg-red-500", "bg-blue-500");
    expect(result).toContain("bg-blue-500");
    expect(result).not.toContain("bg-red-500");

    const resultShort = cn("bg-red", "bg-blue");
    expect(resultShort).toContain("bg-blue");
    expect(resultShort).not.toContain("bg-red");
  });

  it("handles undefined and null values without throwing", () => {
    expect(() => cn(undefined, "text-sm")).not.toThrow();
    expect(cn(undefined, "text-sm")).toBe("text-sm");
    expect(cn(null, "text-sm", undefined)).toBe("text-sm");
  });

  it("handles false, 0, and empty strings without throwing", () => {
    const isHidden = false;
    const count = 0;
    expect(cn(isHidden && "hidden", "p-4", "", count && "text-lg")).toBe("p-4");
  });

  it("handles arrays and conditional class objects", () => {
    expect(cn(["px-2", "py-1"], { "font-bold": true, italic: false })).toBe(
      "px-2 py-1 font-bold",
    );
  });
});
