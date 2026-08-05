import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-5xl font-bold tracking-tight mb-4">
        Verse AI
      </h1>
      <p className="text-lg text-gray-400 max-w-xl mb-10">
        Intelligent DeFi strategies powered by AI. Stake, optimize yields, and manage risk — all on-chain.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full mb-12">
        <div className="rounded-xl border border-gray-800 p-6 bg-gray-950">
          <h2 className="text-xl font-semibold mb-2">🛡 Staking Vault</h2>
          <p className="text-sm text-gray-400">Stake VERSE tokens and earn rewards with pause-protected security.</p>
        </div>
        <div className="rounded-xl border border-gray-800 p-6 bg-gray-950">
          <h2 className="text-xl font-semibold mb-2">🧠 AI Strategies</h2>
          <p className="text-sm text-gray-400">On-chain AI modules for automated rebalancing and risk assessment.</p>
        </div>
        <div className="rounded-xl border border-gray-800 p-6 bg-gray-950">
          <h2 className="text-xl font-semibold mb-2">🔮 Oracle Manager</h2>
          <p className="text-sm text-gray-400">Bidirectional price feeds with deactivation guards for reliable data.</p>
        </div>
      </div>

      <div className="flex gap-4">
        <Link
          href="https://github.com/hlevi0648-wq/verse-ai"
          className="rounded-lg bg-white text-black px-6 py-3 text-sm font-medium hover:bg-gray-200 transition"
        >
          View on GitHub
        </Link>
        <Link
          href="#"
          className="rounded-lg border border-gray-700 px-6 py-3 text-sm font-medium text-gray-300 hover:border-white transition"
        >
          Launch App
        </Link>
      </div>

      <footer className="mt-20 text-xs text-gray-600">
        Verse AI &copy; 2026 — Built with ❤️ on Ethereum
      </footer>
    </div>
  );
}