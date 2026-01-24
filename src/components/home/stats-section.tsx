"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Users, MapPin, ShieldCheck, Banknote } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/stat-card";

interface StatItemProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
}

function StatItem({ icon, value, label, prefix = "", suffix = "" }: StatItemProps) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 mb-4">
        {icon}
      </div>
      <div className="text-3xl md:text-4xl font-bold text-white mb-1">
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
      </div>
      <p className="text-white/70 text-sm">{label}</p>
    </div>
  );
}

interface StatsSectionProps {
  stats: {
    totalUsers: number;
    activeListings: number;
    verifiedSellers: number;
    totalTransacted: number;
  };
  className?: string;
}

function StatsSection({ stats, className }: StatsSectionProps) {
  return (
    <section className={cn("py-16 bg-gradient-to-br from-green-700 to-green-900", className)}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatItem
            icon={<Users className="h-7 w-7 text-white" />}
            value={stats.totalUsers}
            label="Registered Users"
            suffix="+"
          />
          <StatItem
            icon={<MapPin className="h-7 w-7 text-white" />}
            value={stats.activeListings}
            label="Active Listings"
          />
          <StatItem
            icon={<ShieldCheck className="h-7 w-7 text-white" />}
            value={stats.verifiedSellers}
            label="Verified Sellers"
          />
          <StatItem
            icon={<Banknote className="h-7 w-7 text-white" />}
            value={stats.totalTransacted}
            label="GHS Transacted"
            prefix="₵"
            suffix="M+"
          />
        </div>
      </div>
    </section>
  );
}

export { StatsSection };
