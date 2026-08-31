"use client";

import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number; // 0-100
  className?: string;
  indicatorClassName?: string;
}

export function Progress({ value, className, indicatorClassName }: ProgressProps) {
  return (
    <div
      className={cn(
        "w-full h-2 bg-gray-200 rounded-full overflow-hidden",
        className
      )}
    >
      <div
        className={cn(
          "h-full bg-emerald-600 rounded-full transition-all duration-300",
          indicatorClassName
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
