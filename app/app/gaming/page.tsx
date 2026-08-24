import { ConnectButton } from "@/connect/ConnectButton";
import { GameCard } from "./components/GameCard";
import { ActiveSweepstakes } from "./components/ActiveSweepstakes";
import { Leaderboard } from "./components/Leaderboard";

export default function GamingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950/30 to-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              🎮 Verse Gaming
            </h1>
            <p className="text-gray-400 mt-1">
              Provably-fair sweepstakes & games powered by VERSE
            </p>
          </div>
          <ConnectButton />
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Prize Pool", value: "$12,450", icon: "🏆" },
            { label: "Active Players", value: "234", icon: "👥" },
            { label: "Games Played", value: "5,891", icon: "🎯" },
            { label: "Total Paid Out", value: "$89,230", icon: "💰" },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-900/60 border border-purple-500/20 rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-semibold text-white mb-4">🎲 Games</h2>
        <div className="grid grid-cols-3 gap-6 mb-8">
          <GameCard title="Fish Shooter" description="Aim, shoot, earn. Real-time multiplayer fish hunting." buyIn="100 VERSE" maxPayout="1,000 VERSE" players={42} gameType="fish_shooter" />
          <GameCard title="Crypto Slots" description="Spin to win with provably-fair slot mechanics." buyIn="50 VERSE" maxPayout="500 VERSE" players={128} gameType="slots" />
          <GameCard title="Lucky Wheel" description="Spin the wheel for instant crypto prizes." buyIn="25 VERSE" maxPayout="250 VERSE" players={64} gameType="lucky_wheel" />
        </div>

        <h2 className="text-xl font-semibold text-white mb-4">🎟 Active Sweepstakes</h2>
        <ActiveSweepstakes />

        <h2 className="text-xl font-semibold text-white mb-4 mt-8">🏆 Leaderboard</h2>
        <Leaderboard />
      </div>
    </div>
  );
}
