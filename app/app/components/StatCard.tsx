interface StatCardProps { label: string; value: string; change?: string; icon: string; }
export default function StatCard({ label, value, change, icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-800 p-5 bg-gray-950">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {change && (
        <p className={`text-xs mt-1 ${change.startsWith("+") ? "text-green-400" : "text-red-400"}`}>
          {change} from last week
        </p>
      )}
    </div>
  );
}