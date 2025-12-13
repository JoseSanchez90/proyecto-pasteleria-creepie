"use client";

import { useEffect, useState } from "react";

interface DonutChartProps {
  data: {
    label: string;
    value: number;
    color: string;
  }[];
  size?: number;
  thickness?: number;
  showLegend?: boolean;
}

export default function DonutChart({
  data,
  size = 200,
  thickness = 40,
  showLegend = true,
}: DonutChartProps) {
  const [animated, setAnimated] = useState(false);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  let currentAngle = -90; // Start from top

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      {/* Chart */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={thickness}
          />

          {/* Data segments */}
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const segmentLength = (percentage / 100) * circumference;
            const offset = circumference - segmentLength;
            const startAngle = currentAngle;
            currentAngle += (percentage / 100) * 360;

            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={thickness}
                strokeDasharray={`${segmentLength} ${circumference}`}
                strokeDashoffset={animated ? 0 : circumference}
                strokeLinecap="round"
                style={{
                  transform: `rotate(${startAngle}deg)`,
                  transformOrigin: "center",
                  transition: `stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1) ${
                    index * 0.2
                  }s`,
                }}
                className="hover:opacity-80 cursor-pointer"
              />
            );
          })}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-gray-800">
            {total.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-col gap-3">
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
              <div
                key={index}
                className="flex items-center gap-3 group cursor-pointer"
              >
                <div
                  className="w-4 h-4 rounded-full transition-transform group-hover:scale-110"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {item.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.value.toLocaleString()} ({percentage}%)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
