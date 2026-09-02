/**
 * Deterministic mock data generation for reproducible tests.
 * Uses a seeded LCG random number generator for consistent snapshots.
 *
 * Design: each high-level generator (generateMockHistory, generateMockEvents)
 * resets the internal seed before running so that calling them in any order
 * always produces the same output. The low-level generateHex / generateEventId /
 * generateTransactionHash methods DO advance the seed sequentially; only use
 * them directly when you need a continuous sequence.
 */

export class DeterministicMockData {
  private initialSeed: number;
  private seed: number;

  constructor(seedValue: number = 12345) {
    this.initialSeed = seedValue;
    this.seed = seedValue;
  }

  /** Reset the seed back to its initial value. */
  reset(): void {
    this.seed = this.initialSeed;
  }

  /**
   * Seeded pseudo-random number generator (Linear Congruential Generator).
   * Same seed always produces the same sequence.
   */
  private seededRandom(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  /**
   * Generate a deterministic lowercase hex string.
   * @param length - Number of hex characters to generate.
   */
  generateHex(length: number = 64): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += Math.floor(this.seededRandom() * 16).toString(16);
    }
    return result;
  }

	/**
	 * Generate deterministic transaction hash
	 */
	generateTransactionHash(): string {
		return this.generateHex(64);
	}

	/**
	 * Generate deterministic event ID
	 */
	generateEventId(): string {
		return this.generateHex(32);
	}

	/**
	 * Generate mock transaction history with deterministic values
	 */
	generateMockHistory(count: number = 5) {
		const history = [];
		for (let i = 0; i < count; i++) {
			history.push({
				hash: this.generateTransactionHash(),
				ledger: 12345 - i,
				createdAt: new Date(1700000000000 - i * 1000).toISOString(),
				successful: true,
				operationCount: 1,
				feePaid: '100',
			});
		}
		return history;
	}

	/**
	 * Generate mock events with deterministic values
	 */
	generateMockEvents(count: number = 3) {
		const events = [];
		for (let i = 0; i < count; i++) {
			events.push({
				id: this.generateEventId(),
				contractId: this.generateHex(56),
				type: 'contract',
				ledger: 12345 - i,
				createdAt: new Date(1700000000000 - i * 500).toISOString(),
				topics: [this.generateHex(32), this.generateHex(32)],
				value: this.generateHex(64),
			});
		}
		return events;
	}
}

/** Singleton with a fixed seed for consistent test data across imports. */
export const deterministicMock = new DeterministicMockData(12345);
