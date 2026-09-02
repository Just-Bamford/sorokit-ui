import { describe, expect,it } from 'vitest';

import * as exports from '../components/index';

describe('Public exports surface', () => {
  it('exposes all public component exports', () => {
    expect(exports.FeeEstimator).toBeTypeOf('function');
    expect(exports.AddressDisplay).toBeTypeOf('function');
    expect(exports.AssetPill).toBeTypeOf('function');
    expect(exports.ContractEventFeed).toBeTypeOf('function');
  });

  it('re-exports public types from client', () => {
    type Expected = {
      account: exports.AccountData;
      balance: exports.Balance;
      transaction: exports.Transaction;
      claimableBalance: exports.ClaimableBalance;
      contractEvent: exports.ContractEvent;
      networkInfo: exports.NetworkInfo;
      invokeParams: exports.InvokeParams;
    };
    const actual: Expected = {} as Expected;
    expect(actual).toBeDefined();
  });
});
