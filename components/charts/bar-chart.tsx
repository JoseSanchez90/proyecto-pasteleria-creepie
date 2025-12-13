"use client";

import { useEffect, useState } from "react";

interface BarChartProps {
  data: {
    label: string;
    value: number;
  }[];
  maxValue?: number;
  height?: number;
  color?: string;
  showValues?: boolean;
}

export default function BarChart({
  data,
  maxValue,
  height = 300,
  color = "#6366f1",
  showValues = true,
}: BarChartProps) {
  const [animated, setAnimated] = useState(false);
  const max = maxValue || Math.max(...data.map((d) => d.value));

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full">
      <div
        className="flex items-end justify-between gap-2 px-4"
        style={{ height: `${height}px` }}
      >
        {data.map((item, index) => {
          const percentage = (item.value / max) * 100;
          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center justify-end gap-2 group"
            >
              {/* Value label */}
              {showValues && (
                <div
                  className="text-xs font-semibold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    transform: animated ? "translateY(0)" : "translateY(10px)",
                    transition: `all 0.6s ease ${index * 0.1}s`,
                  }}
                >
                  {item.value.toLocaleString()}
                </div>
              )}

              {/* Bar */}
              <div
                className="w-full rounded-t-lg relative overflow-hidden transition-all duration-300 hover:opacity-90 cursor-pointer"
                style={{
                  height: animated ? `${percentage}%` : "0%",
                  background: `linear-gradient(180deg, ${color} 0%, ${color}dd 100%)`,
                  transition: `height 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${
                    index * 0.1
                  }s`,
                  boxShadow: "0 -2px 10px rgba(99, 102, 241, 0.2)",
                }}
              >
                {/* Shine effect */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 50%)",
                  }}
                />
              </div>

              {/* Label */}
              <div className="text-xs text-gray-600 font-medium text-center mt-2 truncate w-full">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
