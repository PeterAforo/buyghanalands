"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, BarChart, PieChart } from "@/components/charts";
import {
  TrendingUp,
  Home,
  DollarSign,
  FileText,
  Loader2,
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600">Track your performance and insights</p>
          </div>
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
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Listings</p>
                  <p className="text-2xl font-bold">{overview?.summary.totalListings || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Home className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {overview?.summary.activeListings || 0} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Transactions</p>
                  <p className="text-2xl font-bold">{overview?.summary.totalTransactions || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {overview?.summary.completedTransactions || 0} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(revenue?.totalRevenue || 0)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {revenue?.transactionCount || 0} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Conversion Rate</p>
                  <p className="text-2xl font-bold">
                    {overview?.summary.totalListings
                      ? ((overview.summary.completedTransactions / overview.summary.totalListings) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Listings to sales</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Activity Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {overview?.chartData && overview.chartData.length > 0 ? (
                <AreaChart
                  data={overview.chartData.map((d) => ({ name: d.name, value: d.listings }))}
                  height={300}
                  color="#10b981"
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {revenue?.chartData && revenue.chartData.length > 0 ? (
                <BarChart
                  data={revenue.chartData}
                  height={300}
                  color="#3b82f6"
                  formatValue={formatCurrency}
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No revenue data
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Listings by Land Type</CardTitle>
            </CardHeader>
            <CardContent>
              {listings?.byLandType && listings.byLandType.length > 0 ? (
                <PieChart
                  data={listings.byLandType}
                  height={300}
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No listings data
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Listings by Region</CardTitle>
            </CardHeader>
            <CardContent>
              {listings?.byRegion && listings.byRegion.length > 0 ? (
                <BarChart
                  data={listings.byRegion}
                  height={300}
                  layout="vertical"
                  color="#8b5cf6"
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No regional data
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
