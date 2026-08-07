"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/stake", label: "Stake" },
  { href: "/strategies", label: "Strategies" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [showWallets, setShowWallets] = useState(false);

  const walletOptions = [
    { connector: connectors.find((c) => c.id === "metaMask" || c.name === "MetaMask"), name: "MetaMask", icon: "🦊", desc: "Browser extension" },
    { connector: connectors.find((c) => c.id === "trustWallet" || c.name === "Trust Wallet"), name: "Trust Wallet", icon: "🛡️", desc: "Mobile & browser" },
    { connector: connectors.find((c) => c.id === "walletConnect" || c.name === "WalletConnect"), name: "WalletConnect", icon: "🔗", desc: "Scan QR code" },
  ].filter((w) => w.connector);

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Verse <span className="text-blue-400">AI</span>
        </Link>
        <div className="flex gap-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                pathname === l.href ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}>{l.label}</Link>
          ))}
        </div>
        {isConnected ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-gray-300 bg-gray-800 px-3 py-1.5 rounded-lg">
              {address?.slice(0,6)}...{address?.slice(-4)}
            </span>
            <button onClick={() => disconnect()}
              className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-500 transition">
              Disconnect
            </button>
          </div>
        ) : (
          <div className="relative">
            <button onClick={() => setShowWallets(!showWallets)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
              Connect Wallet
            </button>
            {showWallets && (
              <div className="absolute right-0 top-12 w-72 rounded-xl border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-800">
                  <p className="text-sm font-semibold">Connect Wallet</p>
                  <p className="text-xs text-gray-500">Choose your preferred wallet</p>
                </div>
                {walletOptions.map((w) => (
                  <button key={w.name}
                    onClick={() => { connect({ connector: w.connector! }); setShowWallets(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition text-left">
                    <span className="text-2xl">{w.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{w.name}</p>
                      <p className="text-xs text-gray-500">{w.desc}</p>
                    </div>
                  </button>
                ))}
                <div className="px-4 py-2 border-t border-gray-800">
                  <p className="text-xs text-gray-600 text-center">By connecting, you agree to the Terms of Service</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}