export const SEPOLIA_ADDRESSES = {
  VerseToken: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  StakingVault: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  RewardDistributor: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  Treasury: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  StrategyManager: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  OracleManager: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
  EmergencyPause: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
} as const;

export const StakingVaultABI = [
  { name: "totalStaked", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "stakedBalanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "earnedRewards", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "paused", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "bool" }] },
  { name: "stake", type: "function", stateMutability: "payable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { name: "unstake", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { name: "claimRewards", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
] as const;

export const VerseTokenABI = [
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { name: "allowance", type: "function", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
] as const;

export const RewardDistributorABI = [
  { name: "rewardRate", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "totalDistributed", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
] as const;
