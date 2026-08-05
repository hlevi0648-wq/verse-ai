"use client";
import { useAccount, useReadContract } from "wagmi";
import { formatEther } from "viem";
import StatCard from "../components/StatCard";

const VAULT = "0x0000000000000000000000000000000000000000" as `0x${string}`;
const ABI = [
  { name: "totalStaked", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "stakedBalanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "earnedRewards", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "paused", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "bool" }] },
] as const;

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { data: totalStaked } = useReadContract({ address: VAULT, abi: ABI, functionName: "totalStaked" });
  const { data: userStaked } = useReadContract({ address: VAULT, abi: ABI, functionName: "stakedBalanceOf", args: address ? [address] : undefined });
  const { data: rewards } = useReadContract({ address: VAULT, abi: ABI, functionName: "earnedRewards", args: address ? [address] : undefined });
  const { data: isPaused } = useReadContract({ address: VAULT, abi: ABI, functionName: "paused" });

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-400 mb-8">Overview of your Verse AI positions and protocol health.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Value Locked" value={totalStaked ? `${Number(formatEther(totalStaked as bigint)).toLocaleString()} VERSE` : "$12.4M"} icon="💰" />
        <StatCard label="VERSE Price" value="$0.0842" change="+2.1%" icon="📈" />
        <StatCard label="Your Staked VERSE" value={userStaked ? Number(formatEther(userStaked as bigint)).toLocaleString() : "0"} change="+5.0%" icon="🛡" />
        <StatCard label="Rewards Earned" value={rewards ? `${Number(formatEther(rewards as bigint)).toLocaleString()} VERSE` : "0 VERSE"} change="+12.4%" icon="🏆" />
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
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {[
              { action: "Staked", amount: "10,000 VERSE", time: "2 hours ago" },
              { action: "Reward Claimed", amount: "420 VERSE", time: "1 day ago" },
              { action: "Rebalanced", amount: "Strategy A → B", time: "3 days ago" },
              { action: "Unstaked", amount: "5,000 VERSE", time: "1 week ago" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
                <div><p className="text-sm font-medium">{item.action}</p><p className="text-xs text-gray-500">{item.time}</p></div>
                <span className="text-sm text-gray-300">{item.amount}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-gray-800 p-6 bg-gray-950">
          <h2 className="text-lg font-semibold mb-4">Protocol Health</h2>
          <div className="space-y-4">
            {[
              { label: "APY (Staking)", value: "12.4%", color: "bg-green-500" },
              { label: "APY (Strategy A)", value: "18.7%", color: "bg-blue-500" },
              { label: "APY (Strategy B)", value: "22.1%", color: "bg-purple-500" },
              { label: "Risk Score", value: "Low", color: "bg-green-500" },
              { label: "Pause Status", value: isPaused ? "Paused" : "Active", color: isPaused ? "bg-red-500" : "bg-green-500" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-sm font-medium">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}