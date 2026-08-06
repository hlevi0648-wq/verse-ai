"use client";
import { useConnect } from "wagmi";

export default function ConnectWallet() {
  const { connect, connectors } = useConnect();

  const walletOptions = [
    { connector: connectors.find((c) => c.id === "metaMask" || c.name === "MetaMask"), name: "MetaMask", icon: "🦊", desc: "Browser extension", color: "from-orange-600 to-orange-500" },
    { connector: connectors.find((c) => c.id === "trustWallet" || c.name === "Trust Wallet"), name: "Trust Wallet", icon: "🛡️", desc: "Mobile & browser", color: "from-blue-600 to-cyan-500" },
    { connector: connectors.find((c) => c.id === "walletConnect" || c.name === "WalletConnect"), name: "WalletConnect", icon: "🔗", desc: "Scan QR code", color: "from-blue-500 to-blue-400" },
  ].filter((w) => w.connector);

  return (
    <div className="max-w-md mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">Connect Wallet</h1>
      <p className="text-gray-400 mb-8">Choose a wallet to access Verse AI on-chain features.</p>
      <div className="space-y-3">
        {walletOptions.map((w) => (
          <button key={w.name}
            onClick={() => w.connector && connect({ connector: w.connector })}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-800 bg-gray-950 hover:bg-gray-900 hover:border-gray-600 transition">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${w.color} flex items-center justify-center text-2xl`}>
              {w.icon}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">{w.name}</p>
              <p className="text-xs text-gray-500">{w.desc}</p>
            </div>
            <svg className="w-4 h-4 ml-auto text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-600 text-center mt-6">By connecting, you agree to the Terms of Service</p>
    </div>
  );
}