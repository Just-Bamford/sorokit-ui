<div align="center">

<h1>sorokit-ui</h1>

<p><strong>React component library for Stellar.</strong></p>

<p>
  Drop-in UI primitives for wallet connection, transaction flows,<br/>
  account display, and Soroban contract interaction — powered by <code>sorokit-core</code>.
</p>

<p>
  <a href="https://github.com/Just-Bamford/sorokit-ui/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" />
  </a>
  <a href="https://github.com/Just-Bamford/sorokit-ui/blob/main/CHANGELOG.md">
    <img src="https://img.shields.io/badge/changelog-1.0.0-9c27b0.svg" alt="Changelog" />
  </a>
  <img src="https://img.shields.io/badge/react-%5E18.0-61dafb" alt="React 18" />
  <img src="https://img.shields.io/badge/typescript-%5E5.0-3178c6" alt="TypeScript" />
  <img src="https://img.shields.io/badge/stellar-mainnet%20%7C%20testnet%20%7C%20futurenet-6f42c1" alt="Stellar Networks" />
</p>

<p>Part of the <a href="https://github.com/Just-Bamford">sorokit</a> ecosystem.</p>

<br/>

</div>

---

## Overview

`sorokit-ui` is the React layer of the sorokit ecosystem. It provides ready-to-use components that connect directly to `sorokit-core` — so you can add wallet connection, balance display, payment flows, and Soroban contract interaction to your app without building any of the wiring yourself.

All components are unstyled by default and accept a `className` prop, making them compatible with Tailwind, CSS Modules, or any styling approach you already use.

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Provider Setup](#provider-setup)
- [Components](#components)
- [Hooks](#hooks)
- [Styling](#styling)
- [Theming](#theming)
- [Networks](#networks)
- [Design Principles](#design-principles)
- [License](#license)

---

## Installation

```bash
npm install sorokit-ui sorokit-core @creit.tech/stellar-wallets-kit
```

Both `sorokit-core` and `@creit.tech/stellar-wallets-kit` are required peer dependencies.

---

## Quick Start

Wrap your app in `SorokitProvider`, then use components anywhere in the tree:

```tsx
import {
  SorokitProvider,
  ConnectWalletButton,
  AccountBalance,
} from "sorokit-ui";

function App() {
  return (
    <SorokitProvider network="testnet">
      <ConnectWalletButton />
      <AccountBalance />
    </SorokitProvider>
  );
}
```

---

## Provider Setup

`SorokitProvider` initialises a `sorokit-core` client and makes it available to all child components via context.

```tsx
import { SorokitProvider } from "sorokit-ui";

<SorokitProvider
  network="testnet" // "mainnet" | "testnet" | "futurenet"
  horizonUrl="https://..." // optional: override Horizon URL
  rpcUrl="https://..." // optional: override Soroban RPC URL
>
  {children}
</SorokitProvider>;
```

---

## Components

The package ships a broad set of reusable UI building blocks for wallets, accounts, transactions, Soroban flows, and shared layout primitives.

| Category              | Component                   | Purpose                                                            |
| --------------------- | --------------------------- | ------------------------------------------------------------------ |
| **Wallet**            | WalletConnectButton         | Connect or disconnect a Stellar wallet with a ready-to-use button. |
|                       | AddressDisplay              | Render and format a wallet or account address.                     |
|                       | WalletConnectModal          | Modal for wallet connection with multiple adapter support.         |
|                       | WalletStatusBadge           | Display current wallet connection status indicator.                |
| **Account**           | AccountCard                 | Display account summary information in a compact card.             |
|                       | AccountBalanceChart         | Visual chart of account balance history.                           |
|                       | AccountSidebar              | Account information sidebar with quick stats.                      |
|                       | BalanceList                 | Present the connected account's balances in a list.                |
|                       | AssetBadge                  | Show an asset code and related badge styling.                      |
|                       | AssetFilter                 | Filter and search assets by code or issuer.                        |
|                       | ClaimableBalanceCard        | Display claimable balance details in a card.                       |
| **Transactions**      | TransactionHistory          | Show recent account transactions.                                  |
|                       | TransactionHistoryTable     | Enhanced table view of transaction history with filters.           |
|                       | TransactionPanel            | Manage transaction submission and status details.                  |
|                       | TransactionStatusTracker    | Real-time transaction status monitoring.                           |
|                       | TransactionFeeCalculator    | Calculate and display transaction fees.                            |
|                       | TransactionConfirmModal     | Confirmation dialog for transaction submission.                    |
|                       | FeeEstimator                | Estimate fees for a proposed transaction.                          |
|                       | BatchPaymentProcessor       | Process and manage batch payments.                                 |
|                       | MultiSigTransactionBuilder  | Build multi-signature transactions.                                |
|                       | QRCode                      | Render a QR code for addresses or payment requests.                |
| **Soroban**           | SorobanPanel                | Provide a full Soroban contract interaction experience.            |
|                       | SorobanInvokeButton         | Trigger a contract invocation from a button.                       |
|                       | ContractEventFeed           | Stream and display contract events.                                |
|                       | ContractInteractionBuilder  | Visual builder for contract interactions.                          |
|                       | ContractInteractionDebugger | Debug contract calls with detailed output.                         |
| **DeFi**              | SwapSimulator               | Simulate and preview swap trades.                                  |
|                       | SwapExecutionTracker        | Track swap execution and status.                                   |
|                       | SwapRoute                   | Visualize swap routes and paths.                                   |
|                       | PortfolioRebalancer         | Portfolio rebalancing UI with recommendations.                     |
|                       | RebalancerHistory           | View rebalancing history and performance.                          |
|                       | GasOptimizer                | Optimize transaction gas usage.                                    |
|                       | AllowanceManager            | Manage and approve token allowances.                               |
| **Staking & Rewards** | StakingDashboard            | Comprehensive staking overview and management.                     |
|                       | RewardsPanel                | Display rewards and earnings.                                      |
|                       | RewardHistory               | Historical rewards tracking and analytics.                         |
|                       | DelegationRow               | Manage individual delegations.                                     |
| **Governance**        | GovernanceDashboard         | Voting and governance interface.                                   |
| **Validators**        | ValidatorCard               | Display validator information and metrics.                         |
|                       | ValidatorSearch             | Search and discover validators.                                    |
| **NFT**               | NFTGallery                  | Display and browse NFT collections.                                |
| **Network**           | NetworkBanner               | Display the active network context.                                |
|                       | NetworkSwitcher             | Let users switch between Stellar networks.                         |
| **Layout**            | Sidebar                     | Render app navigation in a sidebar shell.                          |
|                       | TopBar                      | Render a top navigation bar.                                       |
| **Screens**           | Dashboard                   | Main dashboard screen.                                             |
|                       | BudgetScreen                | Budget management interface.                                       |
|                       | ChartingScreen              | Charts and analytics dashboard.                                    |
|                       | RecoveryScreen              | Account recovery and restoration UI.                               |
|                       | YieldFarmingScreen          | Yield farming opportunities and management.                        |
|                       | NFTScreen                   | Complete NFT management interface.                                 |
| **UI Primitives**     | Badge                       | Small status or label badge primitive.                             |
|                       | Button                      | Flexible button primitive.                                         |
|                       | Card                        | Surface container primitive.                                       |
|                       | Input                       | Text input primitive.                                              |
|                       | Separator                   | Horizontal divider primitive.                                      |
|                       | Skeleton                    | Loading placeholder primitive.                                     |
|                       | Toast                       | Toast notification component.                                      |
|                       | Tooltip                     | Tooltip overlay component.                                         |
|                       | InfoCell                    | Display labeled information cells.                                 |
|                       | LabelledValue               | Labeled value display component.                                   |
|                       | PieChart                    | Pie chart visualization.                                           |
| **Timeline**          | ActivityTimeline            | Visual timeline of account activity.                               |
| **Error Handling**    | ErrorBoundary               | Catch rendering errors and show a fallback state.                  |

For upgrade notes and release history, see [CHANGELOG.md](CHANGELOG.md).

---

## New in This Release

### New Components (50+)

**Account & Balance Management**

- `AccountBalanceChart` - Visual balance history charts
- `AccountSidebar` - Account info sidebar
- `ActivityTimeline` - Transaction activity visualization

**Transaction Management**

- `TransactionHistoryTable` - Enhanced transaction history table
- `TransactionStatusTracker` - Real-time transaction status
- `TransactionFeeCalculator` - Fee calculation UI
- `TransactionConfirmModal` - Confirmation dialogs
- `BatchPaymentProcessor` - Batch payment interface
- `MultiSigTransactionBuilder` - Multi-sig transaction UI

**DeFi Components**

- `SwapSimulator` - Swap preview and simulation
- `SwapExecutionTracker` - Swap execution monitoring
- `SwapRoute` - Route visualization
- `PortfolioRebalancer` - Portfolio rebalancing (807+ lines)
- `RebalancerHistory` - Rebalancing history view
- `GasOptimizer` - Gas optimization UI (478+ lines)
- `AllowanceManager` - Token allowance management (553+ lines)

**Staking & Rewards**

- `StakingDashboard` - Staking overview (525+ lines)
- `RewardsPanel` - Rewards display
- `RewardHistory` - Historical rewards tracking
- `DelegationRow` - Delegation management

**Governance & Validation**

- `GovernanceDashboard` - Governance interface
- `ValidatorCard` - Validator information
- `ValidatorSearch` - Validator discovery

**NFT Management**

- `NFTGallery` - NFT collection display (1,096+ lines)

**Advanced Features**

- `ContractInteractionBuilder` - Visual contract builder (448+ lines)
- `ContractInteractionDebugger` - Contract call debugger (427+ lines)
- `AssetFilter` - Asset filtering UI (794+ lines)
- `WalletConnectModal` - Enhanced wallet modal (285+ lines)
- `AllocationInput` - Allocation input component

**New Screens**

- `BudgetScreen` - Budget management
- `ChartingScreen` - Analytics and charting
- `RecoveryScreen` - Account recovery (306+ lines)
- `YieldFarmingScreen` - Yield farming dashboard (284+ lines)
- `NFTScreen` - NFT management

**New UI Primitives**

- `Toast` - Toast notifications
- `Tooltip` - Tooltip component
- `PieChart` - Pie chart visualization
- `InfoCell` - Info display cells
- `LabelledValue` - Labeled value display
- `Separator` - Enhanced separator
- `Badge` - Enhanced badge

### Infrastructure & Testing

- 50+ new test files with comprehensive coverage
- Accessibility compliance checking (axe-critical)
- Bundle size optimization (50 KB gzipped budget)
- Enhanced Tailwind CSS theming
- Toast notification context
- Improved error boundaries

### Performance

- Optimized bundle size tracking
- Public API type checking (`npm run test:exports`)
- Enhanced component memo optimization
- Streaming for large data sets

---

## Hooks

If you need the underlying client or wallet state directly, hooks are available:

```tsx
import { useSorokit, useWallet, useAccount, useTransaction } from "sorokit-ui";

// Access the raw sorokit-core client
const { client } = useSorokit();

// Wallet state and connect/disconnect actions
const { publicKey, connected, connect, disconnect } = useWallet();

// Account data for the connected wallet
const { balances, loading, error } = useAccount();

// Build and submit transactions
const { buildPayment, submit, status } = useTransaction();
```

### `refreshAccount`

Re-fetches the connected account data and balances. Useful when the user expects their balance to have changed (e.g. after receiving a payment) without disconnecting and reconnecting.

```tsx
const { refreshAccount, isLoadingAccount } = useSorokit();

// Await the refresh to know when it has completed
await refreshAccount();
```

`refreshAccount` returns a `Promise<void>` that resolves once both `getAccount` and `getBalances` have settled. `isLoadingAccount` is `true` while the request is in flight.

All hooks must be used inside a `SorokitProvider`. When used outside one, `useSorokit` returns safe no-op defaults rather than throwing, so components render in a neutral disconnected state.

---

## Tailwind CSS Setup

`sorokit-ui` is styled with [Tailwind CSS v4](https://tailwindcss.com). To use the library in your own Tailwind project:

### 1. Import the CSS file

```css
@import "sorokit-ui/style.css";
```

This imports the pre-built component styles, design tokens (surfaces, text, borders, brand colors), and all custom utility classes (`bg-surface`, `text-ink`, `border-line`, etc.).

### 2. Scan library files in your Tailwind config

If you are using Tailwind's JIT engine (Tailwind v3 with `tailwind.config.js`) or the automatic content detection in Tailwind v4, you may need to configure `@source` directives or the `content` glob to pick up class names used inside the library:

```css
/* Tailwind v4 — add to your main CSS file */
@import "tailwindcss";
@source "../node_modules/sorokit-ui";
```

For Tailwind v3, add to `tailwind.config.js`:

```js
module.exports = {
  content: [
    "./src/**/*.{ts,tsx}",
    "./node_modules/sorokit-ui/dist/**/*.{js,mjs}",
  ],
};
```

### 3. Verify theme tokens

The library exposes CSS custom properties on `:root` (see [Theming](#theming) below). Override any token to customise the appearance:

```css
:root {
  --color-brand: #replac3;
  --color-surface: #ffffff;
  --color-ink: #1a1a1a;
}
```

---

## Styling

Components are unstyled by default. Every component accepts a `className` prop:

```tsx
// Tailwind
<ConnectWalletButton className="rounded-lg bg-indigo-600 px-4 py-2 text-white" />

// CSS Modules
<AccountBalance className={styles.balance} />
```

To apply a consistent base style across all components, pass a `classNames` map to the provider:

```tsx
<SorokitProvider
  network="testnet"
  classNames={{
    connectButton: "rounded-lg bg-indigo-600 px-4 py-2 text-white",
    accountBalance: "font-mono text-sm text-gray-700",
  }}
>
  {children}
</SorokitProvider>
```

---

## Theming

`sorokit-ui` ships with a dark-first design token system defined in `src/index.css`. All components reference semantic CSS custom properties rather than hardcoded colours, so consumer apps can adapt the library to light mode or a custom brand palette by overriding tokens on `:root`.

### Token categories

| Category  | Examples                                               | Utility classes                         |
| --------- | ------------------------------------------------------ | --------------------------------------- |
| Surfaces  | `--color-base`, `--color-surface`, `--color-surface-2` | `bg-base`, `bg-surface`, `bg-surface-2` |
| Text      | `--color-ink`, `--color-ink-2`, `--color-ink-3`        | `text-ink`, `text-ink-2`, `text-ink-3`  |
| Borders   | `--color-line`, `--color-line-2`                       | `border-line`, `border-line-2`          |
| Brand     | `--color-brand`, `--color-brand-hover`                 | `bg-brand`, `text-brand`                |
| State     | `--color-success-bg`, `--color-error-bg`               | `bg-success-dim`, `bg-error-dim`        |
| QR canvas | `--color-qr-canvas-bg`, `--color-qr-canvas-fg`         | —                                       |

### Light mode adaptation

Override tokens in your app's global stylesheet. The library uses `color-scheme: dark` by default; switch to light by overriding surface and ink tokens and setting `color-scheme: light`:

```css
:root {
  color-scheme: light;

  --color-base: #ffffff;
  --color-surface: #f5f5f5;
  --color-surface-2: #ebebeb;
  --color-ink: #1a1a1a;
  --color-ink-2: #666666;
  --color-ink-3: #999999;
  --color-line: #e0e0e0;

  /* QR codes: white background works in light mode by default */
  --color-qr-canvas-bg: #ffffff;
  --color-qr-canvas-fg: #0d0d0d;
}
```

You can also respect the OS preference with `prefers-color-scheme`:

```css
@media (prefers-color-scheme: light) {
  :root {
    color-scheme: light;
    --color-base: #ffffff;
    /* …other light tokens */
  }
}
```

### Component-level overrides

`QRCode` accepts `canvasBackground` and `canvasForeground` props for per-instance control. All other components accept `className` for local overrides.

---

## Networks

```tsx
// Development
<SorokitProvider network="testnet">

// Production
<SorokitProvider network="mainnet">

// Bleeding edge
<SorokitProvider network="futurenet">

// Self-hosted infrastructure
<SorokitProvider
  network="mainnet"
  horizonUrl="https://my-horizon.example.com"
  rpcUrl="https://my-rpc.example.com"
>
```

---

## Design Principles

**Composable** — every component does one thing. Combine them freely; there are no required groupings or wrapper hierarchies beyond the provider.

**Unstyled by default** — no opinion about your design system. Bring Tailwind, CSS Modules, styled-components, or plain CSS.

**Powered by sorokit-core** — all network logic lives in [`sorokit-core`](https://github.com/Just-Bamford/sorokit-core). Components are thin UI wrappers — no duplicated Stellar logic, no diverging behaviour between the SDK and the UI layer.

**No-throw, all the way down** — error states are props and hook return values, never unhandled exceptions.

---

## Contributing

Pull requests are welcome. For significant changes, please open an issue first to discuss what you'd like to change.

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed development guidelines, code style, and the PR process.

---

## Publishing to npm

This package is now public (`"private": false` in package.json). To publish a new version:

1. Update the version in `package.json`
2. Update [CHANGELOG.md](CHANGELOG.md) with changes
3. Create a GitHub release with tag `v{version}`
4. CI automatically publishes to npm

Requires `NPM_TOKEN` secret in GitHub repository settings.

---

## License

[MIT](LICENSE)
