"use client";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

interface PriceData {
  token: string;
  name: string;
  price_usd: number;
  change_24h: number;
  volume_24h: number;
  market_cap: number;
}

interface Analytics {
  total_tvl: number;
  total_staked: number;
  total_rewards: number;
  verse_price: number;
  eth_price: number;
  avg_apy: number;
  risk_score: number;
  sharpe_ratio: number;
  strategies_count: number;
}

interface Recommendation {
  strategy_name: string;
  action: string;
  allocation_percent: number;
  reason: string;
  confidence: number;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Strategies() {
  const { isConnected } = useAccount();
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [pRes, aRes, rRes] = await Promise.all([
          fetch(`${API}/api/v1/prices`),
          fetch(`${API}/api/v1/analytics`),
          fetch(`${API}/api/v1/recommendations?risk_tolerance=medium`),
        ]);
        if (pRes.ok) setPrices(await pRes.json());
        if (aRes.ok) setAnalytics(await aRes.json());
        if (rRes.ok) setRecommendations(await rRes.json());
      } catch (e) {
        console.error("API fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/4" />
          <div className="h-64 bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">AI Strategies</h1>
      <p className="text-gray-400 mb-8">Real-time market data and AI-powered portfolio recommendations.</p>

      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-gray-800 p-4 bg-gray-950">
            <p className="text-xs text-gray-500">ETH Price</p>
            <p className="text-lg font-bold">${analytics.eth_price?.toLocaleString(undefined, {maximumFractionDigits: 2}) || "—"}</p>
          </div>
          <div className="rounded-xl border border-gray-800 p-4 bg-gray-950">
            <p className="text-xs text-gray-500">Avg APY</p>
            <p className="text-lg font-bold text-green-400">{analytics.avg_apy?.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl border border-gray-800 p-4 bg-gray-950">
            <p className="text-xs text-gray-500">Sharpe Ratio</p>
            <p className="text-lg font-bold">{analytics.sharpe_ratio?.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-gray-800 p-4 bg-gray-950">
            <p className="text-xs text-gray-500">Risk Score</p>
            <p className="text-lg font-bold">{analytics.risk_score?.toFixed(0)}/100</p>
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">Market Prices</h2>
      <div className="rounded-xl border border-gray-800 overflow-hidden mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-950">
              <th className="text-left px-4 py-3 text-xs text-gray-500">Token</th>
              <th className="text-right px-4 py-3 text-xs text-gray-500">Price</th>
              <th className="text-right px-4 py-3 text-xs text-gray-500">24h Change</th>
              <th className="text-right px-4 py-3 text-xs text-gray-500">Market Cap</th>
            </tr>
          </thead>
          <tbody>
            {prices.map((p) => (
              <tr key={p.token} className="border-b border-gray-800/50">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-right">${p.price_usd.toLocaleString()}</td>
                <td className={`px-4 py-3 text-right ${p.change_24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {p.change_24h >= 0 ? "+" : ""}{p.change_24h.toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-right text-gray-400">${(p.market_cap / 1e6).toFixed(1)}M</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-semibold mb-4">AI Recommendations</h2>
      <div className="space-y-4">
        {recommendations.map((r, i) => (
          <div key={i} className="rounded-xl border border-gray-800 p-6 bg-gray-950">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{r.strategy_name}</h3>
              <span className={`text-sm px-3 py-1 rounded-full ${r.action === "buy" ? "bg-green-900/30 text-green-400" : r.action === "sell" ? "bg-red-900/30 text-red-400" : "bg-gray-800 text-gray-400"}`}>
                {r.action.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-3">{r.reason}</p>
            <div className="flex gap-6 text-sm">
              <span className="text-gray-500">Allocation: <span className="text-white">{r.allocation_percent}%</span></span>
              <span className="text-gray-500">Confidence: <span className="text-white">{r.confidence}%</span></span>
            </div>
          </div>
        ))}
      </div>

      {!isConnected && (
        <div className="mt-8 rounded-xl border border-gray-800 p-6 bg-gray-950 text-center">
          <p className="text-gray-400 mb-4">Connect your wallet to execute strategies</p>
        </div>
      )}
    </div>
  );
}
