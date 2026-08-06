"use client";
import { useState } from "react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, useConnect } from "wagmi";
import { parseEther, formatEther } from "viem";

const VAULT = "0x0000000000000000000000000000000000000000" as `0x${string}`;
const ABI = [
  { name: "stake", type: "function", stateMutability: "payable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { name: "unstake", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { name: "stakedBalanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "earnedRewards", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "paused", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "bool" }] },
] as const;

export default function Stake() {
  const [amount, setAmount] = useState("");
  const [tab, setTab] = useState<"stake" | "unstake">("stake");
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  const { data: stakedBalance } = useReadContract({ address: VAULT, abi: ABI, functionName: "stakedBalanceOf", args: address ? [address] : undefined });
  const { data: earnedRewards } = useReadContract({ address: VAULT, abi: ABI, functionName: "earnedRewards", args: address ? [address] : undefined });
  const { data: isPaused } = useReadContract({ address: VAULT, abi: ABI, functionName: "paused" });

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleAction = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    writeContract({ address: VAULT, abi: ABI, functionName: tab === "stake" ? "stake" : "unstake", args: [parseEther(amount)] });
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">Staking Vault</h1>
      <p className="text-gray-400 mb-8">Stake VERSE tokens to earn rewards and participate in governance.</p>
      {!isConnected ? (
        <div className="rounded-xl border border-gray-800 p-10 bg-gray-950 text-center mb-6">
          <p className="text-gray-400 mb-6">Connect your wallet to start staking</p>
          <button onClick={() => connect({ connector: connectors[0] })}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-lg transition">
            Connect Wallet
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-xl border border-gray-800 p-4 bg-gray-950">
              <p className="text-xs text-gray-500 mb-1">Staked Balance</p>
              <p className="text-xl font-bold">{stakedBalance ? formatEther(stakedBalance as bigint) : "0"} VERSE</p>
            </div>
            <div className="rounded-xl border border-gray-800 p-4 bg-gray-950">
              <p className="text-xs text-gray-500 mb-1">Earned Rewards</p>
              <p className="text-xl font-bold text-green-400">{earnedRewards ? formatEther(earnedRewards as bigint) : "0"} VERSE</p>
            </div>
          </div>
          {isPaused && (
            <div className="rounded-lg bg-yellow-900/30 border border-yellow-700 px-4 py-3 mb-6 text-sm text-yellow-300">
              ⚠️ Staking is currently paused. Unstaking is still available.
            </div>
          )}
          <div className="flex gap-2 mb-6">
            <button onClick={() => setTab("stake")} disabled={!!isPaused}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition ${tab === "stake" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"} ${isPaused ? "opacity-50 cursor-not-allowed" : ""}`}>
              Stake
            </button>
            <button onClick={() => setTab("unstake")}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition ${tab === "unstake" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
              Unstake
            </button>
          </div>
          <div className="rounded-xl border border-gray-800 p-6 bg-gray-950 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400">{tab === "stake" ? "Stake" : "Unstake"} VERSE</span>
              <span className="text-xs text-gray-500">Staked: {stakedBalance ? formatEther(stakedBalance as bigint) : "0"} VERSE</span>
            </div>
            <div className="relative">
              <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-4 text-xl font-mono focus:outline-none focus:border-blue-500 transition" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                {["25%","50%","75%","MAX"].map((pct) => (
                  <button key={pct} onClick={() => {
                    const bal = stakedBalance ? Number(formatEther(stakedBalance as bigint)) : 0;
                    setAmount(pct === "MAX" ? String(bal) : String(bal * parseInt(pct) / 100));
                  }} className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition">{pct}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
              <span>≈ ${(parseFloat(amount || "0") * 0.0842).toFixed(2)} USD</span>
              <span>Min: 100 VERSE</span>
            </div>
          </div>
          <div className="rounded-xl border border-gray-800 p-5 bg-gray-950 mb-6 space-y-3">
            <div className="flex justify-between text-sm"><span className="text-gray-400">Current APY</span><span className="text-green-400 font-medium">12.4%</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Rewards Auto-compound</span><span className="font-medium">Enabled</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Lock Period</span><span className="font-medium">None (Flexible)</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Est. Weekly Reward</span><span className="font-medium">~{((parseFloat(amount || "0") * 0.124) / 52).toFixed(1)} VERSE</span></div>
          </div>
          <button onClick={handleAction}
            className="w-full py-4 rounded-lg bg-blue-600 text-white font-medium text-lg hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!amount || parseFloat(amount) <= 0 || isConfirming || (tab === "stake" && !!isPaused)}>
            {isConfirming ? "Confirming..." : tab === "stake" ? "Stake VERSE" : "Unstake VERSE"}
          </button>
          {isSuccess && (
            <div className="mt-4 rounded-lg bg-green-900/30 border border-green-700 px-4 py-3 text-sm text-green-300">
              ✅ Transaction confirmed! Your {tab === "stake" ? "stake" : "unstake"} was successful.
            </div>
          )}
        </>
      )}
    </div>
  );
}