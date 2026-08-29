import { type ClassValue,clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Truncate a Stellar address, Soroban contract ID (C…), or tx hash for display.
 * Contract IDs are 56 characters like account addresses and truncate the same way.
 */
export function truncateAddress(address: string | null | undefined, start = 6, end = 4): string {
  if (!address) return "";
  const chars = Array.from(address);
  if (chars.length <= start + end) return address;
  return `${chars.slice(0, start).join("")}...${chars.slice(-end).join("")}`;
}

export function safeFormat(balance: string): string {
  const n = parseFloat(balance);
  if (!balance || isNaN(n)) return "0.00";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

/**
 * Validate a Stellar public address: must start with 'G' and be 56
 * characters of base32 (RFC 4648, no padding) — the same charset the
 * StrKey checksum encoding uses.
 */
export function validateStellarAddress(address: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(address.trim());
}

const STROOPS_PER_XLM = 10_000_000;

/**
 * Convert a stroop amount (the smallest Stellar unit) to an XLM string
 * formatted to 7 decimal places. Returns "0.0000000" for invalid input.
 */
export function toXLM(stroops: string): string {
  const n = parseInt(stroops, 10);
  if (Number.isNaN(n)) return (0).toFixed(7);
  return (n / STROOPS_PER_XLM).toFixed(7);
}

export function friendlyError(message: string): string {
  const normalizedMessage = message.trim().toLowerCase();

  if (
    normalizedMessage.includes("op_underfunded") ||
    normalizedMessage.includes("underfunded")
  ) {
    return "Insufficient balance to submit this transaction. Add more XLM and try again.";
  }

  if (
    normalizedMessage.includes("tx_bad_seq") ||
    normalizedMessage.includes("bad sequence")
  ) {
    return "Your account sequence is out of date. Refresh and try again.";
  }

  if (
    normalizedMessage.includes("simulation failed") ||
    normalizedMessage.includes("simulate transaction") ||
    normalizedMessage.includes("rpc") ||
    normalizedMessage.includes("execution failed")
  ) {
    return "The contract call could not be simulated. Please review the inputs and try again.";
  }

  if (
    normalizedMessage.includes("account not found") ||
    normalizedMessage.includes("contract not found") ||
    normalizedMessage.includes("resource not found") ||
    normalizedMessage.includes("not found")
  ) {
    return "The account or contract could not be found on this network.";
  }

  if (
    normalizedMessage.includes("resource limit") ||
    normalizedMessage.includes("fee limit") ||
    normalizedMessage.includes("insufficient fee") ||
    normalizedMessage.includes("resource")
  ) {
    return "This transaction used too many network resources. Try again with a simpler request.";
  }

  return "Something went wrong while invoking the contract. Please try again.";
}
