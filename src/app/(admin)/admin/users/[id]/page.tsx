"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ChevronRight,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Shield,
  Ban,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Building,
  FileText,
  CreditCard,
} from "lucide-react";

interface UserDetail {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  roles: string[];
  kycTier: string;
  accountStatus: string;
  createdAt: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  address: string | null;
  city: string | null;
  region: string | null;
  recentListings: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
  }>;
  recentTransactions: Array<{
    id: string;
    status: string;
    agreedPriceGhs: string;
    createdAt: string;
  }>;
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setUserId(p.id));
  }, [params]);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (authStatus === "authenticated" && userId) {
      fetchUser();
    }
  }, [authStatus, userId, router]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (action: "suspend" | "activate") => {
    if (!user) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        fetchUser();
      }
    } catch (error) {
      console.error("User action error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(parseFloat(amount));
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a3a2f]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <User className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm font-medium">User not found</p>
        <Link href="/admin/users" className="text-xs text-[#1a3a2f] hover:underline mt-2 inline-block">
          Back to users
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <Link href="/admin" className="hover:text-[#1a3a2f]">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/admin/users" className="hover:text-[#1a3a2f]">Customers</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#1a3a2f]">{user.fullName}</span>
          </div>
          <h1 className="text-lg font-semibold text-[#1a3a2f]">User Details</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/users"
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          {user.accountStatus === "ACTIVE" ? (
            <button
              onClick={() => handleUserAction("suspend")}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 text-orange-600 rounded-lg text-xs font-medium hover:bg-orange-100 transition-colors disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
              Suspend User
            </button>
          ) : (
            <button
              onClick={() => handleUserAction("activate")}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
              Activate User
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* User Profile Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-[#c5e063] flex items-center justify-center">
              <span className="text-[#1a3a2f] font-bold text-lg">
                {user.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-[#1a3a2f]">{user.fullName}</h2>
              <p className="text-xs text-gray-400">ID: {user.id.slice(0, 12)}...</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-[#1a3a2f]">{user.phone}</span>
              {user.phoneVerified && (
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded">Verified</span>
              )}
            </div>
            {user.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-[#1a3a2f]">{user.email}</span>
                {user.emailVerified && (
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded">Verified</span>
                )}
              </div>
            )}
            {(user.city || user.region) && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{[user.city, user.region].filter(Boolean).join(", ")}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Joined {formatDate(user.createdAt)}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-1.5">
              {user.roles.map((role) => (
                <span key={role} className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-medium rounded">
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Account Status</span>
            </div>
            <span className={`px-2.5 py-1 text-xs font-medium rounded ${
              user.accountStatus === "ACTIVE" 
                ? "bg-emerald-100 text-emerald-700" 
                : user.accountStatus === "SUSPENDED"
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-600"
            }`}>
              {user.accountStatus}
            </span>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">KYC Tier</span>
            </div>
            <span className={`px-2.5 py-1 text-xs font-medium rounded ${
              user.kycTier === "TIER_3" 
                ? "bg-emerald-100 text-emerald-700" 
                : user.kycTier === "TIER_2"
                ? "bg-amber-100 text-amber-700"
                : "bg-gray-100 text-gray-600"
            }`}>
              {user.kycTier.replace("_", " ")}
            </span>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Listings</span>
            </div>
            <p className="text-xl font-bold text-[#1a3a2f]">{user.recentListings?.length || 0}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Transactions</span>
            </div>
            <p className="text-xl font-bold text-[#1a3a2f]">{user.recentTransactions?.length || 0}</p>
          </div>
        </div>

        {/* Activity */}
        <div className="space-y-4">
          {/* Recent Listings */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-[#1a3a2f] mb-3">Recent Listings</h3>
            {user.recentListings && user.recentListings.length > 0 ? (
              <div className="space-y-2">
                {user.recentListings.slice(0, 3).map((listing) => (
                  <div key={listing.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-xs font-medium text-[#1a3a2f] truncate max-w-[150px]">{listing.title}</p>
                      <p className="text-[10px] text-gray-400">{formatDate(listing.createdAt)}</p>
                    </div>
                    <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                      listing.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {listing.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No listings yet</p>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-[#1a3a2f] mb-3">Recent Transactions</h3>
            {user.recentTransactions && user.recentTransactions.length > 0 ? (
              <div className="space-y-2">
                {user.recentTransactions.slice(0, 3).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-xs font-medium text-[#1a3a2f]">{formatCurrency(tx.agreedPriceGhs)}</p>
                      <p className="text-[10px] text-gray-400">{formatDate(tx.createdAt)}</p>
                    </div>
                    <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                      tx.status === "RELEASED" ? "bg-emerald-100 text-emerald-700" 
                      : tx.status === "IN_ESCROW" ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600"
                    }`}>
                      {tx.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No transactions yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
