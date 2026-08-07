"use client";
import { useAccount, useReadContract } from "wagmi";
import { formatEther } from "viem";
import StatCard from "../components/StatCard";
import { SEPOLIA_ADDRESSES, StakingVaultABI, VerseTokenABI, RewardDistributorABI } from "../config/contracts";

const VAULT = SEPOLIA_ADDRESSES.StakingVault as `0x${string}`;
const TOKEN = SEPOLIA_ADDRESSES.VerseToken as `0x${string}`;
const REWARDS = SEPOLIA_ADDRESSES.RewardDistributor as `0x${string}`;

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { data: totalStaked } = useReadContract({ address: VAULT, abi: StakingVaultABI, functionName: "totalStaked" });
  const { data: userStaked } = useReadContract({ address: VAULT, abi: StakingVaultABI, functionName: "stakedBalanceOf", args: address ? [address] : undefined });
  const { data: rewards } = useReadContract({ address: VAULT, abi: StakingVaultABI, functionName: "earnedRewards", args: address ? [address] : undefined });
  const { data: isPaused } = useReadContract({ address: VAULT, abi: StakingVaultABI, functionName: "paused" });
  const { data: tokenBalance } = useReadContract({ address: TOKEN, abi: VerseTokenABI, functionName: "balanceOf", args: address ? [address] : undefined });
  const { data: rewardRate } = useReadContract({ address: REWARDS, abi: RewardDistributorABI, functionName: "rewardRate" });
  const { data: totalDistributed } = useReadContract({ address: REWARDS, abi: RewardDistributorABI, functionName: "totalDistributed" });

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-400 mb-8">Overview of your Verse AI positions and protocol health.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Value Locked" value={totalStaked ? `${Number(formatEther(totalStaked as bigint)).toLocaleString()} VERSE` : "—"} icon="💰" />
        <StatCard label="Your VERSE Balance" value={tokenBalance ? `${Number(formatEther(tokenBalance as bigint)).toLocaleString()} VERSE` : "—"} icon="🪙" />
        <StatCard label="Your Staked VERSE" value={userStaked ? Number(formatEther(userStaked as bigint)).toLocaleString() : "—"} icon="🛡" />
        <StatCard label="Rewards Earned" value={rewards ? `${Number(formatEther(rewards as bigint)).toLocaleString()} VERSE` : "—"} icon="🏆" />
      </div>
      {isConnected && (
        <div className="rounded-xl border border-blue-800 p-5 bg-blue-950/30 mb-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-400">Connected Wallet</p><p className="text-xs font-mono text-gray-300">{address?.slice(0,6)}...{address?.slice(-4)}</p></div>
            <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded">Connected</span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-800 p-6 bg-gray-950">
          <h2 className="text-lg font-semibold mb-4">Protocol Stats</h2>
          <div className="space-y-4">
            <div className="flex justify-between text-sm"><span className="text-gray-400">Reward Rate</span><span className="font-medium">{rewardRate ? `${formatEther(rewardRate as bigint)} VERSE/block` : "—"}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Total Distributed</span><span className="font-medium">{totalDistributed ? `${Number(formatEther(totalDistributed as bigint)).toLocaleString()} VERSE` : "—"}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Pause Status</span><span className={`font-medium ${isPaused ? "text-red-400" : "text-green-400"}`}>{isPaused ? "Paused ⚠️" : "Active ✅"}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Network</span><span className="font-medium">Sepolia Testnet</span></div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-800 p-6 bg-gray-950">
          <h2 className="text-lg font-semibold mb-4">Contract Addresses</h2>
          <div className="space-y-3">
            {Object.entries(SEPOLIA_ADDRESSES).map(([name, addr]) => (
              <div key={name} className="flex justify-between items-center text-sm">
                <span className="text-gray-400">{name}</span>
                <a href={`https://sepolia.etherscan.io/address/${addr}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-blue-400 hover:text-blue-300">{addr.slice(0,6)}...{addr.slice(-4)}</a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}