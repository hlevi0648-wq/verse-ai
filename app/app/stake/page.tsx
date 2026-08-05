"use client";
import { useState } from "react";

export default function Stake() {
  const [amount, setAmount] = useState("");
  const [tab, setTab] = useState<"stake" | "unstake">("stake");
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">Staking Vault</h1>
      <p className="text-gray-400 mb-8">Stake VERSE tokens to earn rewards and participate in governance.</p>
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("stake")}
          className={`flex-1 py-3 rounded-lg text-sm font-medium transition ${tab === "stake" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
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
          <span className="text-xs text-gray-500">Balance: 125,000 VERSE</span>
        </div>
        <div className="relative">
          <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-4 text-xl font-mono focus:outline-none focus:border-blue-500 transition" />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
            {["25%", "50%", "75%", "MAX"].map((pct) => (
              <button key={pct} onClick={() => setAmount(pct === "MAX" ? "125000" : String(125000 * parseInt(pct) / 100))}
                className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition">{pct}</button>
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
      <button className="w-full py-4 rounded-lg bg-blue-600 text-white font-medium text-lg hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!amount || parseFloat(amount) <= 0}>{tab === "stake" ? "Stake VERSE" : "Unstake VERSE"}</button>
      <p className="text-xs text-gray-600 text-center mt-4">Connect your wallet to stake. Contracts are pause-protected for your security.</p>
    </div>
  );
}