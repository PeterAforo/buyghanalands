"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LucideIcon, ChevronRight } from "lucide-react";

interface QuickAction {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: "green" | "blue" | "amber" | "purple" | "red";
}

interface QuickActionsProps {
  actions: QuickAction[];
  className?: string;
}

const colorClasses = {
  green: "bg-green-50 text-green-600 group-hover:bg-green-100",
  blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
  amber: "bg-amber-50 text-amber-600 group-hover:bg-amber-100",
  purple: "bg-purple-50 text-purple-600 group-hover:bg-purple-100",
  red: "bg-red-50 text-red-600 group-hover:bg-red-100",
};

function QuickActions({ actions, className }: QuickActionsProps) {
  return (
    <div className={cn("bg-white rounded-xl border border-gray-100", className)}>
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Quick Actions</h3>
      </div>

      <div className="divide-y divide-gray-50">
        {actions.map((action, index) => {
          const Icon = action.icon;

          return (
            <Link
              key={index}
              href={action.href}
              className="group flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div
                className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                  colorClasses[action.color]
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 group-hover:text-green-600 transition-colors">
                  {action.title}
                </p>
                <p className="text-sm text-gray-500">{action.description}</p>
              </div>

              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export { QuickActions };
export type { QuickAction };
