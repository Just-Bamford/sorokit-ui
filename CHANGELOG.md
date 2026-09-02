# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Bundle size tracking with `size-limit` and a 50 KB gzipped budget for the
  published ES and CommonJS bundles (`npm run size`).
- `npm run test:exports` script to type-check the public API surface in CI.

### Changed

- CI (`test.yml`) now runs the bundle-size check after the build and wires up
  the `size` and `test:exports` scripts it previously referenced.

### Fixed

- `NetworkBanner` no longer renders on the Network screen, removing the
  redundant "You are on <Network>" banner when the active network is already
  shown in the screen's content (#170).
- Added copy-to-clipboard buttons to the Passphrase, RPC URL, and Horizon URL
  `InfoCell`s on the Network screen, matching the existing `AddressDisplay`
  copy pattern, so developers can copy values for custom infrastructure setup
  (#170).
- `NetworkBanner` now transitions smoothly (`transition-all duration-300`)
  when colour and text change on network switch, instead of updating
  instantly (#170).

## [1.0.0] - 2026-06-27

### Fixed

- `NetworkBanner` no longer renders on the Network screen, removing the
  redundant "You are on <Network>" banner when the active network is already
  shown in the screen's content (#170).
- Added copy-to-clipboard buttons to the Passphrase, RPC URL, and Horizon URL
  `InfoCell`s on the Network screen, matching the existing `AddressDisplay`
  copy pattern, so developers can copy values for custom infrastructure setup
  (#170).
- `NetworkBanner` now transitions smoothly (`transition-all duration-300`)
  when colour and text change on network switch, instead of updating
  instantly (#170).

## [1.0.0] - 2026-06-27

### Added

- Initial stable release of Sorokit UI
- `SorobanPanel` component for contract interaction
- `TransactionPanel` component for transaction management
- `ErrorBoundary` error handling
- `FeeEstimator` component for fee calculation
- `ContractEventFeed` for contract event monitoring
- `SorokitProvider` context for Stellar wallet integration
- Full TypeScript support
- Comprehensive test suite

### Changed

- Improved performance in contract invocation
- Better error messages for wallet connection failures
- Enhanced accessibility for all components

### Fixed

- Memory leaks in event listeners
- Race conditions in wallet connection

### Known Issues

#### Race Conditions in Wallet Connection (#3)
When connecting to wallet, rapid successive calls to `getClient()` may cause race conditions. **Workaround**: Wait for connection confirmation before subsequent calls.

**Status**: High priority - will be fixed in 1.1.0

#### Eager Screen Mounting Issue (#2)
The `ErrorBoundary` component mounts aggressively on load, which may cause performance issues in slow environments. This is particularly noticeable on mobile devices with limited resources.

**Status**: Under investigation - potential fix in 1.0.1

#### Broken QR Code Scanner (#8)
The QR code scanner component in `ContractEventFeed` fails to decode certain contract addresses with complex metadata. This particularly affects contracts deployed on mainnet.

**Status**: Known limitation - use manual address entry as workaround

### Deprecations

None yet

## Installation

```bash
npm install sorokit-ui
```

## Quick Start

```typescript
import { SorokitProvider, SorobanPanel } from 'sorokit-ui';

function App() {
  return (
    <SorokitProvider>
      <SorobanPanel />
    </SorokitProvider>
  );
}
```

---

### Previous Releases

See GitHub releases for older versions.
