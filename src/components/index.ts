/**
 * Sorokit UI - React components for Stellar/Soroban development
 *
 * @packageDocumentation
 *
 * @example
 * ```tsx
 * import { SorokitProvider, SorobanPanel } from 'sorokit-ui';
 *
 * export function App() {
 *   return (
 *     <SorokitProvider>
 *       <SorobanPanel />
 *     </SorokitProvider>
 *   );
 * }
 * ```
 */

import "../styles.css";

// UI primitives
export { Badge } from "./ui/Badge";
export { Button } from "./ui/Button";
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/Card";
export { Input } from "./ui/Input";
export { AssetRowSkeleton, Skeleton, SkeletonCard, SkeletonRow } from "./ui/Skeleton";
export type { InfoCellProps } from "./ui/InfoCell";
export { InfoCell } from "./ui/InfoCell";

// Error handling
export { ErrorBoundary } from "./ErrorBoundary";

// Wallet
export { AccountCard, AccountCardCompact } from "./AccountCard";
export type { AccountSidebarProps } from "./AccountSidebar";
export { AccountSidebar } from "./AccountSidebar";
export { BalanceList } from "./BalanceList";
export { WalletConnectButton } from "./WalletConnectButton";
export type { WalletConnectModalProps, WalletOption } from "./WalletConnectModal";
export {
  DEFAULT_WALLET_OPTIONS,
  WalletConnectModal,
} from "./WalletConnectModal";

// Assets
export { AssetBadge, AssetPill } from "./AssetBadge";

// Address
export { AddressDisplay } from "./AddressDisplay";

// Network
export { NetworkBanner } from "./NetworkBanner";
export { NetworkSwitcher } from "./NetworkSwitcher";

// Allowances
export { AllowanceManager } from "./AllowanceManager";

// Transactions
export { ActivityTimeline } from "./ActivityTimeline";
export { ClaimableBalanceCard } from "./ClaimableBalanceCard";
export { FeeEstimator } from "./FeeEstimator";
export { GasOptimizer } from "./GasOptimizer";
export type {
  TransactionConfirmModalProps,
  TransactionFeeBreakdown,
  TransactionOperationSummary,
  TransactionPreviewData,
} from "./TransactionConfirmModal";
export { TransactionConfirmModal } from "./TransactionConfirmModal";
export { TransactionHistory } from "./TransactionHistory";
export { TransactionPanel } from "./TransactionPanel";

// Soroban
export { ContractEventFeed } from "./ContractEventFeed";
export { SorobanInvokeButton } from "./SorobanInvokeButton";
export { SorobanPanel } from "./SorobanPanel";

// NFT Gallery
export type { NFTGalleryProps } from "./NFTGallery";
export { NFTCard, NFTGallery } from "./NFTGallery";

// Portfolio Rebalancer
export { PortfolioRebalancer } from "./PortfolioRebalancer";

// Staking Dashboard
export { AllocationInput } from "./AllocationInput";
export type { DelegationRowProps } from "./DelegationRow";
export { DelegationRow } from "./DelegationRow";
export { RebalancerHistory } from "./RebalancerHistory";
export type { RewardHistoryProps } from "./RewardHistory";
export { RewardHistory } from "./RewardHistory";
export type { RewardsPanelProps } from "./RewardsPanel";
export { RewardsPanel } from "./RewardsPanel";
export type { StakingDashboardProps } from "./StakingDashboard";
export { StakingDashboard } from "./StakingDashboard";
export { SwapRoute } from "./SwapRoute";
export type { PieChartProps, PieSlice } from "./ui/PieChart";
export { PieChart } from "./ui/PieChart";
export type { ValidatorCardProps } from "./ValidatorCard";
export { ValidatorCard } from "./ValidatorCard";
export type { ValidatorSearchProps } from "./ValidatorSearch";
export { ValidatorSearch } from "./ValidatorSearch";

// Utilities
export type {
  AllocationDiff,
  PortfolioAsset,
  RebalanceExecution,
  RebalanceRecord,
  SwapStatus,
  SwapSuggestion,
} from "../lib/rebalancer";
export {
  BASE_FEE_STROOPS,
  buildRebalanceRecord,
  computeAllocationDiffs,
  computeCurrentAllocations,
  createInitialExecution,
  DEFAULT_SWAP_FEE_PCT,
  estimateSlippagePct,
  estimateSwapCostUsd,
  formatPct,
  formatUsd,
  generateSwapSuggestions,
  isTargetValid,
  MIN_TRADE_USD,
  normaliseTargets,
  SLIPPAGE_BASE_PCT,
  SLIPPAGE_MARKET_IMPACT_PER_1K,
  totalFeeStroops,
  totalRebalanceCostUsd,
  updateSwapStatus,
  weightedAverageSlippage,
} from "../lib/rebalancer";
export { QRCode } from "./QRCode";

// Staking utilities
export type {
  DailyReward,
  Delegation,
  DelegationChangeRequest,
  DelegationChangeResult,
  RewardEvent,
  RewardScheduleEntry,
  SortDirection,
  Validator,
  ValidatorFilter,
  ValidatorSortField,
  ValidatorStatus,
} from "../lib/staking";
export {
  aggregateDailyRewards,
  createDefaultFilter,
  DELEGATION_BASE_FEE_STROOPS,
  estimateDelegationFeeXlm,
  filterValidators,
  /** @alias formatPct from staking lib */
  formatPct as formatStakingPct,
  formatXlm,
  generateMockRewardHistory,
  MIN_DELEGATION_XLM,
  MOCK_DELEGATIONS,
  MOCK_REWARD_SCHEDULE,
  MOCK_VALIDATORS,
  REWARD_HISTORY_DAYS,
  STROOPS_PER_XLM,
  totalClaimableXlm,
  totalDelegatedXlm,
  totalPendingXlm,
  totalRewardHistoryXlm,
  validateDelegationAmount,
} from "../lib/staking";

// Providers and hooks
export { SorokitProvider } from "../context/SorokitProvider";
export { useSorokit } from "../context/useSorokit";

// Types
export type {
  AccountData,
  Balance,
  ClaimableBalance,
  ContractEvent,
  GroupedTransaction,
  InvokeParams,
  NetworkInfo,
  Nft,
  NftAttribute,
  NftCollection,
  NftMetadata,
  Operation,
  TimelineFilter,
  TimelineGroup,
  Transaction,
} from "../lib/client";
