"use client";
export function ActiveSweepstakes() {
  const sweepstakes = [
    { id: 1, name: "Weekly Grand Prize", entryFee: "200 VERSE", prizePool: "10,000 VERSE", entries: 45, maxEntries: 100, endsIn: "3d 14h" },
    { id: 2, name: "Daily Quick Draw", entryFee: "50 VERSE", prizePool: "2,500 VERSE", entries: 89, maxEntries: 200, endsIn: "8h 22m" },
    { id: 3, name: "Mega Jackpot", entryFee: "500 VERSE", prizePool: "50,000 VERSE", entries: 12, maxEntries: 50, endsIn: "7d 2h" },
  ];
  return (
    <div className="space-y-3">
      {sweepstakes.map((s) => (
        <div key={s.id} className="bg-gray-900/60 border border-purple-500/20 rounded-xl p-4 flex items-center justify-between">
          <div>
            <h4 className="text-white font-medium">{s.name}</h4>
            <div className="flex gap-4 text-sm text-gray-400 mt-1">
              <span>Entry: {s.entryFee}</span>
              <span>Entries: {s.entries}/{s.maxEntries}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-purple-400 font-bold text-lg">{s.prizePool}</div>
            <div className="text-xs text-gray-500">Ends in {s.endsIn}</div>
          </div>
          <button className="ml-4 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-500 transition">Enter</button>
        </div>
      ))}
    </div>
  );
}