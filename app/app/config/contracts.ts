export const CONTRACTS = {
  verseToken: "0xC0B495539d9814dcbA869A9619E87B95881A2536",
  stakingVault: "0xe729a24765485b7F8F712F1B0BA97C6eBC125F9c",
  rewardDistributor: "",
  treasury: "",
  strategyManager: "",
  oracleManager: "",
  emergencyPause: "",
} as const;

export const SEPOLIA_CHAIN_ID = 11155111;

export const EXPLORER_URL = "https://sepolia.etherscan.io";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
