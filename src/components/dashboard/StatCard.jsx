import React from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function StatCard({ label, value, change, icon: Icon, variant = "default" }) {
  const variantStyles = {
    default: "border-slate-200",
    critical: "border-l-4 border-l-red-500",
    high: "border-l-4 border-l-orange-500",
    medium: "border-l-4 border-l-amber-500"
  };

  const getTrendIcon = () => {
    if (change === undefined || change === null) return null;
    if (change > 0) return <TrendingUp className="w-3.5 h-3.5 text-red-500" />;
    if (change < 0) return <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />;
    return <Minus className="w-3.5 h-3.5 text-slate-400" />;
  };

  const getTrendColor = () => {
    if (change === undefined || change === null) return "";
    if (change > 0) return "text-red-600";
    if (change < 0) return "text-emerald-600";
    return "text-slate-500";
  };

  return (
    <Card className={`p-5 ${variantStyles[variant]} bg-white`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500 tracking-tight">{label}</p>
          <p className="text-3xl font-semibold text-slate-900 tracking-tight">{value}</p>
        </div>
        {Icon && (
          <div className="p-2 bg-slate-50 rounded-lg">
            <Icon className="w-5 h-5 text-slate-600" />
          </div>
        )}
      </div>
      {change !== undefined && change !== null && (
        <div className={`flex items-center gap-1 mt-3 text-sm font-medium ${getTrendColor()}`}>
          {getTrendIcon()}
          <span>{change > 0 ? "+" : ""}{change} since last crawl</span>
        </div>
      )}
    </Card>
  );
}