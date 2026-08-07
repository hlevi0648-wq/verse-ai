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
    async function fetch() {
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
    fetch();
    const interval = setInterval(fetch, 30000);
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="rounded-xl border border-gray-800 p-6 bg-gray-950">
          <h2 className="text-lg font-semibold mb-4">Live Prices</h2>
          <div className="space-y-3">
            {prices.map((p) => (
              <div key={p.token} className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{p.token}</span>
                  <span className="text-xs text-gray-500 ml-2">{p.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono">${p.price_usd?.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                  <span className={`ml-2 text-xs ${p.change_24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {p.change_24h >= 0 ? "▲" : "▼"} {Math.abs(p.change_24h).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-800 p-6 bg-gray-950">
          <h2 className="text-lg font-semibold mb-4">AI Recommendations</h2>
          {recommendations.length === 0 ? (
            <p className="text-gray-500 text-sm">No strategies deployed yet. Deploy contracts to get recommendations.</p>
          ) : (
            <div className="space-y-3">
              {recommendations.map((r) => (
                <div key={r.strategy_name} className="flex items-center justify-between p-3 rounded-lg bg-gray-900">
                  <div>
                    <p className="text-sm font-medium">{r.strategy_name}</p>
                    <p className="text-xs text-gray-500">{r.reason}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      r.action === "increase" ? "bg-green-900 text-green-300" :
                      r.action === "reduce" ? "bg-red-900 text-red-300" :
                      "bg-gray-700 text-gray-300"
                    }`}>{r.action.toUpperCase()}</span>
                    <p className="text-xs text-gray-500 mt-1">{r.allocation_percent.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 p-6 bg-gray-950">
        <h2 className="text-lg font-semibold mb-4">Chainlink Oracle Prices</h2>
        <p className="text-xs text-gray-500 mb-3">On-chain price feeds from Chainlink oracles (Sepolia)</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["ETH/USD", "BTC/USD", "LINK/USD", "USDC/USD"].map((pair) => (
            <div key={pair} className="rounded-lg bg-gray-900 p-3">
              <p className="text-xs text-gray-500">{pair}</p>
              <p className="text-sm font-mono font-medium">—</p>
              <p className="text-xs text-gray-600">On-chain</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
