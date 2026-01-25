interface StatsCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: "blue" | "green" | "purple" | "amber";
}

export function StatsCard({
  icon,
  title,
  value,
  subtitle,
  color = "blue",
}: StatsCardProps) {
  const colorClasses = {
    blue: "bg-blue-500/20 text-blue-300",
    green: "bg-emerald-500/20 text-emerald-300",
    purple: "bg-purple-500/20 text-purple-300",
    amber: "bg-amber-500/20 text-amber-300",
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        <div className="flex-1">
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-100">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
