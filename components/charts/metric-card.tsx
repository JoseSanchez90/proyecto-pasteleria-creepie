"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive?: boolean;
  };
  gradient?: string;
  iconBgColor?: string;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  gradient = "from-blue-500 to-blue-600",
  iconBgColor = "bg-blue-600",
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value === 0) return <Minus className="w-3 h-3" />;
    return trend.isPositive ? (
      <TrendingUp className="w-3 h-3" />
    ) : (
      <TrendingDown className="w-3 h-3" />
    );
  };

  const getTrendColor = () => {
    if (!trend) return "";
    if (trend.value === 0) return "text-gray-500 bg-gray-100";
    return trend.isPositive
      ? "text-green-600 bg-green-100"
      : "text-red-600 bg-red-100";
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
      {/* Gradient overlay on hover */}
      <div
        className={`absolute inset-0 bg-linear-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
      />

      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-xl 2xl:text-3xl font-bold text-gray-800 mt-1">
            {value}
          </p>

          {/* Trend or subtitle */}
          <div className="mt-3 flex items-center gap-2">
            {trend ? (
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getTrendColor()}`}
              >
                {getTrendIcon()}
                <span>{Math.abs(trend.value)}%</span>
              </div>
            ) : (
              subtitle && <p className="text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Icon */}
        {icon && (
          <div
            className={`w-10 h-10 2xl:w-14 2xl:h-14 flex items-center justify-center ${iconBgColor} rounded-full transition-transform group-hover:scale-110 duration-300 shadow-lg`}
          >
            <div className="text-white">{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
}
