export default function Strategies() {
  const strategies = [
    { name: "Conservative Yield", apy: "8.2%", risk: "Low", riskColor: "text-green-400", tvl: "$4.1M",
      description: "Stablecoin pools with minimal impermanent loss. Ideal for risk-averse depositors.",
      allocations: ["USDC/DAI — 60%", "VERSE/USDC — 40%"], aiRebalance: "Weekly" },
    { name: "Balanced Growth", apy: "18.7%", risk: "Medium", riskColor: "text-yellow-400", tvl: "$5.8M",
      description: "Diversified across blue-chip DeFi with AI-driven rebalancing for optimal yield.",
      allocations: ["VERSE/ETH — 40%", "USDC/ETH — 30%", "Staking — 30%"], aiRebalance: "Daily" },
    { name: "Aggressive Alpha", apy: "22.1%", risk: "High", riskColor: "text-red-400", tvl: "$2.5M",
      description: "High-yield pools with frequent AI rebalancing. Higher risk, higher reward.",
      allocations: ["VERSE/ETH — 60%", "Long-tail pairs — 30%", "Leverage — 10%"], aiRebalance: "Hourly" },
  ];
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">AI Strategies</h1>
      <p className="text-gray-400 mb-8">Choose an AI-managed strategy that matches your risk appetite.</p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {strategies.map((s, i) => (
          <div key={i} className="rounded-xl border border-gray-800 bg-gray-950 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{s.name}</h2>
                <span className={`text-xs font-medium px-2 py-1 rounded-full bg-gray-800 ${s.riskColor}`}>{s.risk} Risk</span>
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold">{s.apy}</span>
                <span className="text-sm text-gray-400">APY</span>
              </div>
              <p className="text-sm text-gray-400 mb-5">{s.description}</p>
              <div className="space-y-2 mb-5">
                <div className="flex justify-between text-sm"><span className="text-gray-500">TVL</span><span className="font-medium">{s.tvl}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">AI Rebalance</span><span className="font-medium">{s.aiRebalance}</span></div>
              </div>
              <div className="border-t border-gray-800 pt-4">
                <p className="text-xs text-gray-500 mb-2">Allocations</p>
                {s.allocations.map((a, j) => <p key={j} className="text-xs text-gray-300">{a}</p>)}
              </div>
            </div>
            <button className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-sm font-medium transition border-t border-gray-800">Allocate to Strategy</button>
          </div>
        ))}
      </div>
      <div className="mt-10 rounded-xl border border-gray-800 p-6 bg-gray-950">
        <h2 className="text-lg font-semibold mb-4">🧠 AI Risk Assessment</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Market Volatility", pct: 35, color: "bg-yellow-500", level: "Low" },
            { label: "Smart Contract Risk", pct: 15, color: "bg-green-500", level: "Minimal" },
            { label: "Liquidity Risk", pct: 20, color: "bg-green-500", level: "Low" },
          ].map((r, i) => (
            <div key={i}>
              <p className="text-sm text-gray-400 mb-1">{r.label}</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full ${r.color} rounded-full`} style={{ width: `${r.pct}%` }} />
                </div>
                <span className="text-sm font-medium">{r.level}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}