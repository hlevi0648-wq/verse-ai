"use client";
import { useState } from "react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, useConnect } from "wagmi";
import { parseEther, formatEther } from "viem";
import { SEPOLIA_ADDRESSES, StakingVaultABI, VerseTokenABI } from "../config/contracts";

const VAULT = SEPOLIA_ADDRESSES.StakingVault as `0x${string}`;
const TOKEN = SEPOLIA_ADDRESSES.VerseToken as `0x${string}`;

export default function Stake() {
  const [amount, setAmount] = useState("");
  const [tab, setTab] = useState<"stake" | "unstake">("stake");
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  const { data: stakedBalance } = useReadContract({ address: VAULT, abi: StakingVaultABI, functionName: "stakedBalanceOf", args: address ? [address] : undefined });
  const { data: earnedRewards } = useReadContract({ address: VAULT, abi: StakingVaultABI, functionName: "earnedRewards", args: address ? [address] : undefined });
  const { data: isPaused } = useReadContract({ address: VAULT, abi: StakingVaultABI, functionName: "paused" });
  const { data: tokenBalance } = useReadContract({ address: TOKEN, abi: VerseTokenABI, functionName: "balanceOf", args: address ? [address] : undefined });
  const { data: allowance } = useReadContract({ address: TOKEN, abi: VerseTokenABI, functionName: "allowance", args: address ? [address, VAULT] : undefined });

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const needsApproval = tab === "stake" && allowance !== undefined && BigInt(allowance as any) < parseEther(amount || "0");

  const handleAction = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (tab === "stake" && needsApproval) {
      writeContract({ address: TOKEN, abi: VerseTokenABI, functionName: "approve", args: [VAULT, parseEther(amount)] });
    } else {
      writeContract({ address: VAULT, abi: StakingVaultABI, functionName: tab, args: [parseEther(amount)] });
    }
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
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl border border-gray-800 p-4 bg-gray-950">
              <p className="text-xs text-gray-500 mb-1">Wallet Balance</p>
              <p className="text-lg font-bold">{tokenBalance ? Number(formatEther(tokenBalance as bigint)).toLocaleString() : "0"} VERSE</p>
            </div>
            <div className="rounded-xl border border-gray-800 p-4 bg-gray-950">
              <p className="text-xs text-gray-500 mb-1">Staked</p>
              <p className="text-lg font-bold">{stakedBalance ? formatEther(stakedBalance as bigint) : "0"} VERSE</p>
            </div>
            <div className="rounded-xl border border-gray-800 p-4 bg-gray-950">
              <p className="text-xs text-gray-500 mb-1">Earned</p>
              <p className="text-lg font-bold text-green-400">{earnedRewards ? formatEther(earnedRewards as bigint) : "0"} VERSE</p>
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
              <span className="text-xs text-gray-500">Balance: {tokenBalance ? Number(formatEther(tokenBalance as bigint)).toLocaleString() : "0"}</span>
            </div>
            <div className="relative">
              <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-4 text-xl font-mono focus:outline-none focus:border-blue-500 transition" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                {["25%","50%","MAX"].map((pct) => (
                  <button key={pct} onClick={() => {
                    const bal = tokenBalance ? Number(formatEther(tokenBalance as bigint)) : 0;
                    setAmount(pct === "MAX" ? String(bal) : String(bal * parseInt(pct) / 100));
                  }} className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition">{pct}</button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={handleAction}
            className="w-full py-4 rounded-lg bg-blue-600 text-white font-medium text-lg hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!amount || parseFloat(amount) <= 0 || isConfirming || (tab === "stake" && !!isPaused)}>
            {isConfirming ? "Confirming..." : needsApproval ? "Approve VERSE" : tab === "stake" ? "Stake VERSE" : "Unstake VERSE"}
          </button>
          {isSuccess && (
            <div className="mt-4 rounded-lg bg-green-900/30 border border-green-700 px-4 py-3 text-sm text-green-300">
              ✅ Transaction confirmed! {needsApproval ? "Approval" : tab === "stake" ? "Stake" : "Unstake"} successful.
            </div>
          )}
        </>
      )}
    </div>
  );
}