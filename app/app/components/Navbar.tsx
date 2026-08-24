"use client";

import Link from "next/link";
import { useAccount, useDisconnect } from "wagmi";

export default function Navbar() {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Verse AI
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition text-sm">Dashboard</Link>
          <Link href="/stake" className="text-gray-400 hover:text-white transition text-sm">Stake</Link>
          <Link href="/strategies" className="text-gray-400 hover:text-white transition text-sm">Strategies</Link>
          <Link href="/buy" className="text-green-400 hover:text-green-300 transition text-sm font-medium">💳 Buy</Link>
          <Link href="/withdraw" className="text-yellow-400 hover:text-yellow-300 transition text-sm font-medium">💸 Withdraw</Link>

          {isConnected ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 font-mono">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <button
                onClick={() => disconnect()}
                className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <Link href="/connect" className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg text-sm font-medium transition">
              Connect
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}