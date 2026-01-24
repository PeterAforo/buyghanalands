"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Search,
  User,
  Shield,
  Ban,
  CheckCircle,
  Loader2,
  Phone,
  Mail,
  MoreHorizontal,
  Filter,
  Download,
  Plus,
  ChevronRight,
} from "lucide-react";

interface UserData {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  roles: string[];
  kycTier: string;
  accountStatus: string;
  createdAt: string;
  _count: {
    listings: number;
    transactionsAsBuyer: number;
    transactionsAsSeller: number;
  };
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return { label: "Active", variant: "success" as const };
    case "SUSPENDED":
      return { label: "Suspended", variant: "destructive" as const };
    case "DEACTIVATED":
      return { label: "Deactivated", variant: "secondary" as const };
    default:
      return { label: status, variant: "secondary" as const };
  }
}

function getKycBadge(tier: string) {
  switch (tier) {
    case "TIER_2_GHANA_CARD":
      return { label: "Verified", variant: "success" as const };
    case "TIER_1_ID_UPLOAD":
      return { label: "ID Uploaded", variant: "warning" as const };
    default:
      return { label: "Unverified", variant: "secondary" as const };
  }
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch(`/api/admin/users?filter=${filter}&search=${search}`);
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchUsers();
    }
  }, [session, filter, search]);

  const handleUserAction = async (userId: string, action: "suspend" | "activate" | "deactivate") => {
    setActionLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const updated = await response.json();
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, accountStatus: updated.accountStatus } : u))
        );
      }
    } catch (error) {
      console.error("User action error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a3a2f]" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/admin" className="hover:text-[#1a3a2f]">Dashboard</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-[#1a3a2f]">Customers</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1a3a2f]">Customer Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all platform users and their accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1a3a2f] text-white rounded-xl text-sm font-medium hover:bg-[#2a4a3f] transition-colors">
            <Plus className="h-4 w-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === "all" 
                  ? "bg-[#1a3a2f] text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All Users
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === "active" 
                  ? "bg-[#1a3a2f] text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter("suspended")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === "suspended" 
                  ? "bg-[#1a3a2f] text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Suspended
            </button>
            <button
              onClick={() => setFilter("sellers")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === "sellers" 
                  ? "bg-[#1a3a2f] text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Sellers
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[280px] pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f] focus:border-transparent"
              />
            </div>
            <button className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
              <Filter className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No users found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Roles</th>
                  <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">KYC</th>
                  <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity</th>
                  <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => {
                  const statusBadge = getStatusBadge(user.accountStatus);
                  const kycBadge = getKycBadge(user.kycTier);

                  return (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-[#c5e063] flex items-center justify-center">
                            <span className="text-[#1a3a2f] font-semibold text-sm">
                              {user.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-[#1a3a2f]">{user.fullName}</p>
                            <p className="text-xs text-gray-400">ID: {user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 text-sm text-[#1a3a2f]">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          {user.phone}
                        </div>
                        {user.email && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <span key={role} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                          kycBadge.variant === "success" 
                            ? "bg-emerald-100 text-emerald-700" 
                            : kycBadge.variant === "warning"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {kycBadge.label}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                          statusBadge.variant === "success" 
                            ? "bg-emerald-100 text-emerald-700" 
                            : statusBadge.variant === "destructive"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <p className="text-sm text-[#1a3a2f]">{user._count.listings} listings</p>
                        <p className="text-xs text-gray-400">
                          {user._count.transactionsAsBuyer + user._count.transactionsAsSeller} transactions
                        </p>
                      </td>
                      <td className="py-4 px-5 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          {user.accountStatus === "ACTIVE" ? (
                            <button
                              onClick={() => handleUserAction(user.id, "suspend")}
                              disabled={actionLoading === user.id}
                              className="px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {actionLoading === user.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                "Suspend"
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUserAction(user.id, "activate")}
                              disabled={actionLoading === user.id}
                              className="px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {actionLoading === user.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                "Activate"
                              )}
                            </button>
                          )}
                          <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
