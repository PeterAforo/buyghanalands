"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  description?: string;
  color?: "green" | "blue" | "amber" | "purple" | "red";
  className?: string;
}

const colorClasses = {
  green: "bg-green-50 text-green-600",
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  purple: "bg-purple-50 text-purple-600",
  red: "bg-red-50 text-red-600",
};

function DashboardStatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  color = "green",
  className,
}: DashboardStatCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={cn("p-2.5 rounded-xl", colorClasses[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {(trend || description) && (
        <div className="mt-3 flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-sm font-medium",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {trend.value}%
            </span>
          )}
          {description && (
            <span className="text-sm text-gray-500">{description}</span>
          )}
        </div>
      )}
    </div>
  );
}

interface DashboardStatsGridProps {
  stats: DashboardStatCardProps[];
  className?: string;
}

function DashboardStatsGrid({ stats, className }: DashboardStatsGridProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {stats.map((stat, index) => (
        <DashboardStatCard key={index} {...stat} />
      ))}
    </div>
  );
}

export { DashboardStatCard, DashboardStatsGrid };
