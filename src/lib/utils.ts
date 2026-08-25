import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import type { NetworkName } from "@/lib/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Build a Stellar Expert block explorer URL for a given network and transaction hash.
 * Returns `null` for unrecognised networks so callers can fall back to plain text.
 */
export function getExplorerUrl(
  networkName: NetworkName | undefined | null,
  txHash: string,
): string | null {
  const segment =
    networkName === "mainnet"
      ? "public"
      : networkName === "testnet"
        ? "testnet"
        : null;
  if (!segment) return null;
  return `https://stellar.expert/explorer/${segment}/tx/${txHash}`;
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
