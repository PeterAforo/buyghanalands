"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Home, Building2, Factory, Wheat, Layers } from "lucide-react";

interface LandTypeCardProps {
  type: string;
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

const LAND_TYPE_CONFIG = [
  { type: "RESIDENTIAL", label: "Residential", icon: Home, color: "bg-blue-50 text-blue-600 border-blue-100" },
  { type: "COMMERCIAL", label: "Commercial", icon: Building2, color: "bg-purple-50 text-purple-600 border-purple-100" },
  { type: "INDUSTRIAL", label: "Industrial", icon: Factory, color: "bg-orange-50 text-orange-600 border-orange-100" },
  { type: "AGRICULTURAL", label: "Agricultural", icon: Wheat, color: "bg-green-50 text-green-600 border-green-100" },
  { type: "MIXED", label: "Mixed Use", icon: Layers, color: "bg-amber-50 text-amber-600 border-amber-100" },
];

function LandTypeCard({ type, label, count, icon, color }: LandTypeCardProps) {
  return (
    <Link
      href={`/listings?landType=${type}`}
      className={cn(
        "group flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-300",
        "hover:shadow-lg hover:-translate-y-1",
        color
      )}
    >
      <div className="p-4 rounded-xl bg-white shadow-sm group-hover:shadow-md transition-shadow">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-gray-900">{label}</h3>
      <p className="text-sm text-gray-500 mt-1">{count} listings</p>
    </Link>
  );
}

interface LandTypeCardsProps {
  counts: Record<string, number>;
  className?: string;
}

function LandTypeCards({ counts, className }: LandTypeCardsProps) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-5 gap-4", className)}>
      {LAND_TYPE_CONFIG.map(({ type, label, icon: Icon, color }) => (
        <LandTypeCard
          key={type}
          type={type}
          label={label}
          count={counts[type] || 0}
          icon={<Icon className="h-8 w-8" />}
          color={color}
        />
      ))}
    </div>
  );
}

export { LandTypeCards, LandTypeCard };
