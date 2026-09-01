"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Sparkline } from "./sparkline";

interface DashboardStatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  sparkData?: number[];
  accent?: "emerald" | "gold" | "blue" | "purple" | "pink";
  className?: string;
}

const accentMap = {
  emerald: { chip: "bg-emerald-50 text-emerald-700", spark: "#2F855A" },
  gold: { chip: "bg-amber-50 text-amber-700", spark: "#D69E2E" },
  blue: { chip: "bg-blue-50 text-blue-700", spark: "#3B82F6" },
  purple: { chip: "bg-purple-50 text-purple-700", spark: "#8B5CF6" },
  pink: { chip: "bg-pink-50 text-pink-700", spark: "#EC4899" },
};

export function DashboardStatCard({
  label,
  value,
  icon,
  trend,
  sparkData,
  accent = "emerald",
  className,
}: DashboardStatCardProps) {
  const a = accentMap[accent];
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-emerald-950/[0.06] bg-white p-5",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-12px_rgba(11,31,23,0.18)]",
        className
      )}
    >
      {/* Subtle top gradient sheen */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-900/10 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.8125rem] font-medium text-gray-500">{label}</p>
          <p className="mt-1 font-display text-[1.75rem] font-bold leading-tight text-emerald-950">
            {value}
          </p>
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105",
              a.chip
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold",
              trend.isPositive ? "text-emerald-600" : "text-red-500"
            )}
          >
            {trend.isPositive ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </span>
        )}
        {sparkData && (
          <Sparkline data={sparkData} color={a.spark} className={trend ? "" : "ml-auto"} />
        )}
      </div>
    </div>
  );
}
