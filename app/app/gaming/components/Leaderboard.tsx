"use client";
export function Leaderboard() {
  const players = [
    { rank: 1, name: "CryptoKing", score: "98,450", earnings: "$4,230", game: "Fish Shooter" },
    { rank: 2, name: "WhaleHunter", score: "87,200", earnings: "$3,890", game: "Fish Shooter" },
    { rank: 3, name: "LuckyDraw", score: "76,100", earnings: "$2,450", game: "Crypto Slots" },
    { rank: 4, name: "VerseMaster", score: "65,300", earnings: "$1,890", game: "Lucky Wheel" },
    { rank: 5, name: "DeFiShark", score: "54,800", earnings: "$1,230", game: "Fish Shooter" },
  ];
  return (
    <div className="bg-gray-900/60 border border-purple-500/20 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left text-gray-500 p-3">#</th>
            <th className="text-left text-gray-500 p-3">Player</th>
            <th className="text-left text-gray-500 p-3">Score</th>
            <th className="text-left text-gray-500 p-3">Earnings</th>
            <th className="text-left text-gray-500 p-3">Top Game</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.rank} className="border-b border-gray-800/50 hover:bg-purple-500/5">
              <td className="p-3 text-white font-bold">{p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : p.rank === 3 ? "🥉" : p.rank}</td>
              <td className="p-3 text-white">{p.name}</td>
              <td className="p-3 text-gray-300">{p.score}</td>
              <td className="p-3 text-green-400">{p.earnings}</td>
              <td className="p-3 text-gray-400">{p.game}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}