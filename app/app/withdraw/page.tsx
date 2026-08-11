"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useConnect } from "wagmi";
import { formatEther, parseEther } from "viem";
import { SEPOLIA_ADDRESSES, StakingVaultABI, VerseTokenABI } from "../config/contracts";

const VAULT = SEPOLIA_ADDRESSES.StakingVault as `0x${string}`;
const TOKEN = SEPOLIA_ADDRESSES.VerseToken as `0x${string}`;

export default function WithdrawPage() {
  const [amount, setAmount] = useState("");
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  const { data: stakedBalance } = useReadContract({
    address: VAULT,
    abi: StakingVaultABI,
    functionName: "stakedBalanceOf",
    args: address ? [address] : undefined,
  });

  const { data: earnedRewards } = useReadContract({
    address: VAULT,
    abi: StakingVaultABI,
    functionName: "earnedRewards",
    args: address ? [address] : undefined,
  });

  const { data: isPaused } = useReadContract({
    address: VAULT,
    abi: StakingVaultABI,
    functionName: "paused",
  });

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleUnstake = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    writeContract({
      address: VAULT,
      abi: StakingVaultABI,
      functionName: "unstake",
      args: [parseEther(amount)],
    });
  };

  const handleClaimRewards = () => {
    writeContract({
      address: VAULT,
      abi: StakingVaultABI,
      functionName: "claimRewards",
    });
  };

  const staked = stakedBalance ? Number(formatEther(stakedBalance as bigint)) : 0;
  const rewards = earnedRewards ? Number(formatEther(earnedRewards as bigint)) : 0;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">💸 Withdraw</h1>
      <p className="text-gray-400 mb-8">Unstake VERSE tokens and claim your earned rewards.</p>

      {!isConnected ? (
        <div className="rounded-xl border border-gray-800 p-10 bg-gray-950 text-center">
          <p className="text-gray-400 mb-6">Connect your wallet to withdraw</p>
          <button
            onClick={() => connect({ connector: connectors[0] })}
            className="bg-yellow-600 hover:bg-yellow-500 text-white font-medium px-6 py-3 rounded-lg transition"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-xl border border-gray-800 p-4 bg-gray-950">
              <p className="text-xs text-gray-500 mb-1">Staked Balance</p>
              <p className="text-lg font-bold">{staked.toLocaleString()} VERSE</p>
            </div>
            <div className="rounded-xl border border-gray-800 p-4 bg-gray-950">
              <p className="text-xs text-gray-500 mb-1">Earned Rewards</p>
              <p className="text-lg font-bold text-green-400">{rewards.toLocaleString()} VERSE</p>
            </div>
          </div>

          {isPaused && (
            <div className="rounded-lg bg-yellow-900/30 border border-yellow-700 px-4 py-3 mb-6 text-sm text-yellow-300">
              ⚠️ Contract is paused. Withdrawals may be restricted.
            </div>
          )}

          <div className="rounded-xl border border-gray-800 p-6 bg-gray-950 mb-6">
            <label className="block text-sm text-gray-400 mb-2">Amount to Unstake</label>
            <div className="relative">
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-4 text-xl font-mono focus:outline-none focus:border-yellow-500 transition"
              />
              <button
                onClick={() => setAmount(String(staked))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition"
              >
                MAX
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleUnstake}
              disabled={!amount || parseFloat(amount) <= 0 || isConfirming}
              className="flex-1 py-4 rounded-lg bg-yellow-600 text-white font-medium text-lg hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConfirming ? "Confirming..." : "Unstake VERSE"}
            </button>
            <button
              onClick={handleClaimRewards}
              disabled={rewards <= 0 || isConfirming}
              className="flex-1 py-4 rounded-lg bg-green-600 text-white font-medium text-lg hover:bg-green-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Claim Rewards
            </button>
          </div>

          {isSuccess && (
            <div className="mt-4 rounded-lg bg-green-900/30 border border-green-700 px-4 py-3 text-sm text-green-300">
              ✅ Transaction confirmed!
            </div>
          )}
        </>
      )}
    </div>
  );
}