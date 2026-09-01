"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { AreaChart, BarChart, PieChart } from "@/components/charts";
import {
  PageHeader,
  SectionCard,
  DashboardStatCard,
  EmptyState,
} from "@/components/dashboard";
import {
  TrendingUp,
  Home,
  DollarSign,
  FileText,
  Loader2,
  BarChart3,
} from "lucide-react";

interface OverviewData {
  summary: {
    totalListings: number;
    activeListings: number;
    totalTransactions: number;
    completedTransactions: number;
  };
  chartData: { name: string; listings: number; transactions: number }[];
}

interface RevenueData {
  totalRevenue: number;
  transactionCount: number;
  chartData: { name: string; value: number }[];
}

interface ListingsData {
  total: number;
  byLandType: { name: string; value: number }[];
  byRegion: { name: string; value: number }[];
  byStatus: { name: string; value: number }[];
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `GH₵${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `GH₵${(value / 1000).toFixed(0)}K`;
  }
  return `GH₵${value.toFixed(0)}`;
};

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [listings, setListings] = useState<ListingsData | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [overviewRes, revenueRes, listingsRes] = await Promise.all([
          fetch(`/api/analytics?type=overview&period=${period}`),
          fetch(`/api/analytics?type=revenue&period=${period}`),
          fetch(`/api/analytics?type=listings&period=${period}`),
        ]);

        if (overviewRes.ok) setOverview(await overviewRes.json());
        if (revenueRes.ok) setRevenue(await revenueRes.json());
        if (listingsRes.ok) setListings(await listingsRes.json());
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchAnalytics();
    }
  }, [session, period]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Track your performance and insights"
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Analytics" }]}
        actions={
          <div className="flex gap-2">
            {["7d", "30d", "90d", "1y"].map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : p === "90d" ? "90 Days" : "1 Year"}
              </Button>
            ))}
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardStatCard
          label="Total Listings"
          value={overview?.summary.totalListings || 0}
          icon={<Home className="h-5 w-5" />}
          accent="emerald"
          trend={{ value: overview?.summary.activeListings || 0, isPositive: true }}
        />
        <DashboardStatCard
          label="Total Transactions"
          value={overview?.summary.totalTransactions || 0}
          icon={<FileText className="h-5 w-5" />}
          accent="blue"
          trend={{ value: overview?.summary.completedTransactions || 0, isPositive: true }}
        />
        <DashboardStatCard
          label="Total Revenue"
          value={formatCurrency(revenue?.totalRevenue || 0)}
          icon={<DollarSign className="h-5 w-5" />}
          accent="gold"
          trend={{ value: revenue?.transactionCount || 0, isPositive: true }}
        />
        <DashboardStatCard
          label="Conversion Rate"
          value={`${
            overview?.summary.totalListings
              ? ((overview.summary.completedTransactions / overview.summary.totalListings) * 100).toFixed(1)
              : 0
          }%`}
          icon={<TrendingUp className="h-5 w-5" />}
          accent="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Activity Overview" bodyClassName="p-4">
          {overview?.chartData && overview.chartData.length > 0 ? (
            <AreaChart
              data={overview.chartData.map((d) => ({ name: d.name, value: d.listings }))}
              height={300}
              color="#10b981"
            />
          ) : (
            <EmptyState
              icon={<BarChart3 className="h-7 w-7" />}
              title="No data available"
              description="Analytics data will appear here once available."
            />
          )}
        </SectionCard>

        <SectionCard title="Revenue Trend" bodyClassName="p-4">
          {revenue?.chartData && revenue.chartData.length > 0 ? (
            <BarChart
              data={revenue.chartData}
              height={300}
              color="#3b82f6"
              formatValue={formatCurrency}
            />
          ) : (
            <EmptyState
              icon={<DollarSign className="h-7 w-7" />}
              title="No revenue data"
              description="Revenue trend will appear here once available."
            />
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Listings by Land Type" bodyClassName="p-4">
          {listings?.byLandType && listings.byLandType.length > 0 ? (
            <PieChart
              data={listings.byLandType}
              height={300}
            />
          ) : (
            <EmptyState
              icon={<Home className="h-7 w-7" />}
              title="No listings data"
              description="Listings breakdown will appear here once available."
            />
          )}
        </SectionCard>

        <SectionCard title="Listings by Region" bodyClassName="p-4">
          {listings?.byRegion && listings.byRegion.length > 0 ? (
            <BarChart
              data={listings.byRegion}
              height={300}
              layout="vertical"
              color="#8b5cf6"
            />
          ) : (
            <EmptyState
              icon={<BarChart3 className="h-7 w-7" />}
              title="No regional data"
              description="Regional breakdown will appear here once available."
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
