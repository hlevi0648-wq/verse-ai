"use client";
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
          <button onClick={() => connect({ connector: connectors[0] })}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
}