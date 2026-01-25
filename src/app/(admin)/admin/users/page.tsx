"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Search,
  User,
  Phone,
  Mail,
  MoreHorizontal,
  Download,
  Plus,
  ChevronRight,
  Loader2,
  CheckSquare,
  Square,
  Trash2,
  Ban,
  CheckCircle,
  X,
  Edit,
  Eye,
  UserPlus,
  AlertTriangle,
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
      return { label: "Active", color: "bg-emerald-100 text-emerald-700" };
    case "SUSPENDED":
      return { label: "Suspended", color: "bg-red-100 text-red-700" };
    case "DEACTIVATED":
      return { label: "Deactivated", color: "bg-gray-100 text-gray-600" };
    default:
      return { label: status, color: "bg-gray-100 text-gray-600" };
  }
}

function getKycBadge(tier: string) {
  switch (tier) {
    case "TIER_2_GHANA_CARD":
      return { label: "Verified", color: "bg-emerald-100 text-emerald-700" };
    case "TIER_1_ID_UPLOAD":
      return { label: "ID Uploaded", color: "bg-amber-100 text-amber-700" };
    default:
      return { label: "Unverified", color: "bg-gray-100 text-gray-600" };
  }
}

const AVAILABLE_ROLES = ["BUYER", "SELLER", "AGENT", "PROFESSIONAL", "ADMIN", "SUPPORT", "MODERATOR"];

export default function AdminUsersPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  
  // Selection state
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    roles: ["BUYER"] as string[],
    accountStatus: "ACTIVE",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
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
  }, [filter, search]);

  useEffect(() => {
    if (session?.user) {
      fetchUsers();
    }
  }, [session, fetchUsers]);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
    setSelectAll(newSelected.size === users.length);
  };

  // Single user actions
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

  // Bulk actions
  const handleBulkAction = async () => {
    if (selectedUsers.size === 0 || !bulkAction) return;
    
    setFormLoading(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: bulkAction,
          userIds: Array.from(selectedUsers),
        }),
      });

      if (response.ok) {
        await fetchUsers();
        setSelectedUsers(new Set());
        setSelectAll(false);
        setShowBulkActionModal(false);
        setBulkAction("");
      } else {
        const data = await response.json();
        setFormError(data.error || "Failed to perform action");
      }
    } catch (error) {
      console.error("Bulk action error:", error);
      setFormError("Failed to perform action");
    } finally {
      setFormLoading(false);
    }
  };

  // Create user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchUsers();
        setShowAddModal(false);
        resetForm();
      } else {
        const data = await response.json();
        setFormError(data.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Create user error:", error);
      setFormError("Failed to create user");
    } finally {
      setFormLoading(false);
    }
  };

  // Update user
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setFormError(null);
    setFormLoading(true);

    try {
      const updateData: any = {
        fullName: formData.fullName,
        email: formData.email || null,
        phone: formData.phone,
        roles: formData.roles,
        accountStatus: formData.accountStatus,
      };
      
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        await fetchUsers();
        setShowEditModal(false);
        setEditingUser(null);
        resetForm();
      } else {
        const data = await response.json();
        setFormError(data.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Update user error:", error);
      setFormError("Failed to update user");
    } finally {
      setFormLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    
    setFormLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${deleteUserId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchUsers();
        setShowDeleteModal(false);
        setDeleteUserId(null);
      } else {
        const data = await response.json();
        setFormError(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Delete user error:", error);
      setFormError("Failed to delete user");
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      password: "",
      roles: ["BUYER"],
      accountStatus: "ACTIVE",
    });
    setFormError(null);
  };

  const openEditModal = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email || "",
      phone: user.phone,
      password: "",
      roles: user.roles,
      accountStatus: user.accountStatus,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (userId: string) => {
    setDeleteUserId(userId);
    setShowDeleteModal(true);
  };

  const toggleRole = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  };

  const exportUsers = () => {
    const csvContent = users
      .map((u) => `${u.fullName},${u.phone},${u.email || ""},${u.roles.join(";")},${u.accountStatus}`)
      .join("\n");
    const blob = new Blob([`Name,Phone,Email,Roles,Status\n${csvContent}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users-export.csv";
    a.click();
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
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <Link href="/admin" className="hover:text-[#1a3a2f]">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#1a3a2f]">Customers</span>
          </div>
          <h1 className="text-lg font-semibold text-[#1a3a2f]">Customer Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage all platform users and their accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportUsers}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1a3a2f] text-white rounded-lg text-xs font-medium hover:bg-[#2d5a47] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add User
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.size > 0 && (
        <div className="bg-[#1a3a2f] text-white rounded-xl p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{selectedUsers.size} user(s) selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setBulkAction("activate");
                setShowBulkActionModal(true);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-medium transition-colors"
            >
              Activate
            </button>
            <button
              onClick={() => {
                setBulkAction("suspend");
                setShowBulkActionModal(true);
              }}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 rounded-lg text-xs font-medium transition-colors"
            >
              Suspend
            </button>
            <button
              onClick={() => {
                setBulkAction("delete");
                setShowBulkActionModal(true);
              }}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-medium transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => {
                setSelectedUsers(new Set());
                setSelectAll(false);
              }}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-3 mb-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-1.5">
            {["all", "active", "suspended", "sellers", "agents", "professionals"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                  filter === f
                    ? "bg-[#1a3a2f] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f === "all" ? "All Users" : f}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[180px] pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1a3a2f] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <User className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm font-medium">No users found</p>
            <p className="text-xs text-gray-400 mt-0.5">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="py-3 px-4 text-left">
                    <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">
                      {selectAll ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Roles</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">KYC</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Activity</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => {
                  const statusBadge = getStatusBadge(user.accountStatus);
                  const kycBadge = getKycBadge(user.kycTier);
                  const isSelected = selectedUsers.has(user.id);

                  return (
                    <tr key={user.id} className={`hover:bg-gray-50/50 transition-colors ${isSelected ? "bg-emerald-50/50" : ""}`}>
                      <td className="py-3 px-4">
                        <button onClick={() => toggleSelectUser(user.id)} className="text-gray-400 hover:text-gray-600">
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-[#c5e063] flex items-center justify-center flex-shrink-0">
                            <span className="text-[#1a3a2f] font-semibold text-xs">
                              {user.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-[#1a3a2f] text-sm truncate">{user.fullName}</p>
                            <p className="text-[10px] text-gray-400">ID: {user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-xs text-[#1a3a2f]">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {user.phone}
                        </div>
                        {user.email && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                            <Mail className="h-2.5 w-2.5" />
                            <span className="truncate max-w-[120px]">{user.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <span key={role} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded">
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${kycBadge.color}`}>
                          {kycBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-xs text-[#1a3a2f]">{user._count.listings} listings</p>
                        <p className="text-[10px] text-gray-400">
                          {user._count.transactionsAsBuyer + user._count.transactionsAsSeller} transactions
                        </p>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">{formatDate(user.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          {user.accountStatus === "ACTIVE" ? (
                            <button
                              onClick={() => handleUserAction(user.id, "suspend")}
                              disabled={actionLoading === user.id}
                              className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors disabled:opacity-50"
                              title="Suspend"
                            >
                              {actionLoading === user.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Ban className="h-3.5 w-3.5" />
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUserAction(user.id, "activate")}
                              disabled={actionLoading === user.id}
                              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50"
                              title="Activate"
                            >
                              {actionLoading === user.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => openDeleteModal(user.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#1a3a2f]" />
                <h2 className="font-semibold text-[#1a3a2f]">Add New User</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-4 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{formError}</div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Roles</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                        formData.roles.includes(role)
                          ? "bg-[#1a3a2f] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.accountStatus}
                  onChange={(e) => setFormData({ ...formData, accountStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="DEACTIVATED">Deactivated</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-[#1a3a2f] text-white rounded-lg text-sm font-medium hover:bg-[#2d5a47] disabled:opacity-50"
                >
                  {formLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-[#1a3a2f]" />
                <h2 className="font-semibold text-[#1a3a2f]">Edit User</h2>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-4 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{formError}</div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]"
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Roles</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                        formData.roles.includes(role)
                          ? "bg-[#1a3a2f] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.accountStatus}
                  onChange={(e) => setFormData({ ...formData, accountStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="DEACTIVATED">Deactivated</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-[#1a3a2f] text-white rounded-lg text-sm font-medium hover:bg-[#2d5a47] disabled:opacity-50"
                >
                  {formLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete User?</h3>
              <p className="text-sm text-gray-600 mb-6">
                This will deactivate the user account. This action can be reversed by reactivating the account.
              </p>
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg mb-4">{formError}</div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteUserId(null);
                    setFormError(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {formLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Confirmation Modal */}
      {showBulkActionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                bulkAction === "delete" ? "bg-red-100" : bulkAction === "suspend" ? "bg-orange-100" : "bg-emerald-100"
              }`}>
                {bulkAction === "delete" ? (
                  <Trash2 className="h-6 w-6 text-red-600" />
                ) : bulkAction === "suspend" ? (
                  <Ban className="h-6 w-6 text-orange-600" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 capitalize">
                {bulkAction} {selectedUsers.size} User(s)?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {bulkAction === "delete"
                  ? "This will deactivate the selected user accounts."
                  : bulkAction === "suspend"
                  ? "This will suspend the selected user accounts."
                  : "This will activate the selected user accounts."}
              </p>
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg mb-4">{formError}</div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowBulkActionModal(false);
                    setBulkAction("");
                    setFormError(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAction}
                  disabled={formLoading}
                  className={`flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 ${
                    bulkAction === "delete"
                      ? "bg-red-600 hover:bg-red-700"
                      : bulkAction === "suspend"
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {formLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
