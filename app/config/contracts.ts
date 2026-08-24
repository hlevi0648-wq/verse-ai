export const SEPOLIA_ADDRESSES = {
  VerseToken: "0xC0B495539d9814dcbA869A9619E87B95881A2536" as const,
  StakingVault: "0xe729a24765485b7F8F712F1B0BA97C6eBC125F9c" as const,
  RewardDistributor: "0x568353587bB13D90BE4A49752c7b53aab79F40b4" as const,
  OracleManager: "0xD844243646B9EB6FA6B1Bb7bDEe7CD6B1773b4cf" as const,
  EmergencyPause: "0xFdcB2225A3D639004F60BDe28D48CF2403460b6e" as const,
} as const;

export const SEPOLIA_CHAIN_ID = 11155111;

export const EXPLORER_URL = "https://sepolia.etherscan.io";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const VerseTokenABI = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { type: "function", name: "totalSupply", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
] as const;

export const StakingVaultABI = [
  { type: "function", name: "totalStaked", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "stakedBalanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "earnedRewards", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "paused", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "bool" }] },
  { type: "function", name: "stake", stateMutability: "payable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { type: "function", name: "unstake", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { type: "function", name: "claimRewards", stateMutability: "nonpayable", inputs: [], outputs: [] },
] as const;

export const RewardDistributorABI = [
  { type: "function", name: "rewardRate", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "totalDistributed", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
] as const;
