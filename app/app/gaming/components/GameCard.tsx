"use client";
import { useState } from "react";

interface GameCardProps {
  title: string;
  description: string;
  buyIn: string;
  maxPayout: string;
  players: number;
  gameType: string;
}

export function GameCard({ title, description, buyIn, maxPayout, players, gameType }: GameCardProps) {
  const [joining, setJoining] = useState(false);
  const handleJoin = async () => {
    setJoining(true);
    setTimeout(() => setJoining(false), 2000);
  };
  return (
    <div className="bg-gray-900/60 border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">{players} playing</span>
      </div>
      <p className="text-sm text-gray-400 mb-4">{description}</p>
      <div className="flex items-center justify-between text-sm mb-4">
        <div><span className="text-gray-500">Buy-in:</span> <span className="text-white font-medium">{buyIn}</span></div>
        <div><span className="text-gray-500">Max win:</span> <span className="text-purple-400 font-medium">{maxPayout}</span></div>
      </div>
      <button onClick={handleJoin} disabled={joining} className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50">
        {joining ? "Joining..." : "Play Now"}
      </button>
    </div>
  );
}
