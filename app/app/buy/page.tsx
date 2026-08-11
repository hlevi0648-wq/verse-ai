"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { loadStripe } from "@stripe/stripe-js";
import type { Stripe } from "@stripe/stripe-js";

const STRIPE_PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const PRICE_PER_VERSE = 0.001;

export default function BuyPage() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("1000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tokenAmount = parseFloat(amount) || 0;
  const usdCost = (tokenAmount * PRICE_PER_VERSE).toFixed(2);

  const handleBuy = async () => {
    if (!isConnected || !address) {
      setError("Connect your wallet first");
      return;
    }
    if (tokenAmount < 100) {
      setError("Minimum purchase: 100 VERSE");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenAmount,
          walletAddress: address,
          usdAmount: parseFloat(usdCost),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Payment failed");
      }

      const { sessionId } = await res.json();

      const stripe: Stripe | null = await loadStripe(STRIPE_PK);
      if (stripe) {
        await stripe.redirectToCheckout({ mode: "payment", sessionId });
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const presets = [1000, 5000, 10000, 50000];

  return (
    <div className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">💳 Buy VERSE Tokens</h1>
      <p className="text-gray-400 mb-8">Purchase VERSE with credit card — tokens sent to your wallet</p>

      {!isConnected ? (
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
          <p className="text-gray-400 mb-4">Connect your wallet to buy VERSE</p>
          <a href="/connect" className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-xl font-medium transition">
            Connect Wallet
          </a>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="mb-6 p-4 bg-gray-800 rounded-xl">
            <p className="text-xs text-gray-500">Receiving wallet</p>
            <p className="font-mono text-sm text-purple-400">{address}</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">Amount (VERSE)</label>
            <div className="flex gap-2 mb-3">
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => setAmount(String(p))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    amount === String(p) ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {p.toLocaleString()}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter custom amount"
              min="100"
              className="w-full bg-gray-800 rounded-lg p-3 text-white border border-gray-700 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="bg-gray-800 rounded-xl p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Price per VERSE</span>
              <span>$0.001</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Token amount</span>
              <span>{tokenAmount.toLocaleString()} VERSE</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Network fee</span>
              <span className="text-green-400">Free</span>
            </div>
            <div className="border-t border-gray-700 pt-2 flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span className="text-green-400">${usdCost}</span>
            </div>
          </div>

          <button
            onClick={handleBuy}
            disabled={loading || tokenAmount < 100}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Redirecting to Stripe..." : `Buy ${tokenAmount.toLocaleString()} VERSE — $${usdCost}`}
          </button>

          {error && (
            <p className="mt-3 text-red-400 text-sm">{error}</p>
          )}

          <div className="mt-6 text-xs text-gray-500 space-y-1">
            <p>🔒 Payments processed securely by Stripe (PCI DSS Level 1)</p>
            <p>⚡ Tokens delivered to your wallet within minutes</p>
            <p>💰 No gas fees — we cover the transfer</p>
          </div>
        </div>
      )}
    </div>
  );
}
