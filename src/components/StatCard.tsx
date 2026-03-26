"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: number;
  color?: "blue" | "green" | "amber" | "red" | "purple";
}

const colorMap = {
  blue: { bg: "bg-accent-500/15", icon: "text-accent-400", border: "border-accent-500/20" },
  green: { bg: "bg-success-500/15", icon: "text-success-400", border: "border-success-500/20" },
  amber: { bg: "bg-warning-500/15", icon: "text-warning-400", border: "border-warning-500/20" },
  red: { bg: "bg-danger-500/15", icon: "text-danger-400", border: "border-danger-500/20" },
  purple: { bg: "bg-purple-500/15", icon: "text-purple-400", border: "border-purple-500/20" },
};

export default function StatCard({ title, value, subtitle, icon: Icon, trend, color = "blue" }: StatCardProps) {
  const c = colorMap[color];

  return (
    <div className={`bg-navy-900/80 rounded-2xl p-4 lg:p-5 border ${c.border} hover:border-opacity-50 transition-all`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 lg:w-11 lg:h-11 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
            trend >= 0 ? "bg-success-600/20 text-success-400" : "bg-danger-600/20 text-danger-400"
          }`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-xs lg:text-sm text-navy-300 mb-1">{title}</p>
      <p className="text-xl lg:text-2xl font-bold text-white break-all">{value}</p>
      {subtitle && <p className="text-xs text-navy-400 mt-1">{subtitle}</p>}
    </div>
  );
}
