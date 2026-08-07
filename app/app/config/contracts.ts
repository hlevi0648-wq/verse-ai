export const CONTRACTS = {
  verseToken: "0xC0B495539d9814dcbA869A9619E87B95881A2536",
  stakingVault: "0xe729a24765485b7F8F712F1B0BA97C6eBC125F9c",
  rewardDistributor: "0x568353587bB13D90BE4A49752c7b53aab79F40b4",
  treasury: "",
  strategyManager: "",
  oracleManager: "0xD844243646B9EB6FA6B1Bb7bDEe7CD6B1773b4cf",
  emergencyPause: "0xFdcB2225A3D639004F60BDe28D48CF2403460b6e",
} as const;

export const SEPOLIA_CHAIN_ID = 11155111;

export const EXPLORER_URL = "https://sepolia.etherscan.io";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
