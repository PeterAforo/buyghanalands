"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Search,
  ChevronRight,
  Loader2,
  CheckSquare,
  Square,
  X,
  Edit,
  Eye,
  AlertTriangle,
  Download,
  CreditCard,
  User,
  MapPin,
  CheckCircle,
  Clock,
  DollarSign,
  RefreshCw,
  XCircle,
  ArrowRightLeft,
} from "lucide-react";

interface Transaction {
  id: string;
  status: string;
  agreedPriceGhs: string;
  platformFeeGhs: string;
  sellerNetGhs: string;
  createdAt: string;
  completedAt: string | null;
  listing: {
    id: string;
    title: string;
    region: string;
    district: string;
  };
  buyer: {
    id: string;
    fullName: string;
    phone: string;
  };
  seller: {
    id: string;
    fullName: string;
    phone: string;
  };
  payments: Array<{
    id: string;
    amount: string;
    status: string;
    type: string;
  }>;
  disputes: Array<{
    id: string;
    status: string;
  }>;
}

function formatPrice(price: string | number) {
  const num = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 0,
  }).format(num);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; color: string }> = {
    CREATED: { label: "Created", color: "bg-gray-100 text-gray-600" },
    ESCROW_REQUESTED: { label: "Escrow Requested", color: "bg-blue-100 text-blue-700" },
    FUNDED: { label: "Funded", color: "bg-amber-100 text-amber-700" },
    VERIFICATION_PERIOD: { label: "Verification", color: "bg-purple-100 text-purple-700" },
    DISPUTED: { label: "Disputed", color: "bg-red-100 text-red-700" },
    READY_TO_RELEASE: { label: "Ready to Release", color: "bg-emerald-100 text-emerald-700" },
    RELEASED: { label: "Released", color: "bg-emerald-100 text-emerald-700" },
    REFUNDED: { label: "Refunded", color: "bg-orange-100 text-orange-700" },
    CLOSED: { label: "Closed", color: "bg-gray-100 text-gray-600" },
  };
  return statusMap[status] || { label: status, color: "bg-gray-100 text-gray-600" };
}

export default function AdminTransactionsPage() {
  const { data: session, status: authStatus } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Selection state
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    status: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    funded: 0,
    released: 0,
    disputed: 0,
    totalValue: "0",
  });

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/transactions?filter=${filter}&search=${search}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
        
        // Calculate stats
        const total = data.length;
        const funded = data.filter((t: Transaction) => t.status === "FUNDED").length;
        const released = data.filter((t: Transaction) => t.status === "RELEASED").length;
        const disputed = data.filter((t: Transaction) => t.status === "DISPUTED").length;
        const totalValue = data.reduce((sum: number, t: Transaction) => sum + parseFloat(t.agreedPriceGhs), 0);
        
        setStats({ total, funded, released, disputed, totalValue: totalValue.toString() });
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    if (session?.user) {
      fetchTransactions();
    }
  }, [session, fetchTransactions]);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(transactions.map((t) => t.id)));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelectTransaction = (txId: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(txId)) {
      newSelected.delete(txId);
    } else {
      newSelected.add(txId);
    }
    setSelectedTransactions(newSelected);
    setSelectAll(newSelected.size === transactions.length);
  };

  // Single transaction action
  const handleTransactionAction = async (txId: string, action: "release" | "refund" | "close" | "ready") => {
    setActionLoading(txId);
    try {
      const response = await fetch(`/api/admin/transactions/${txId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        await fetchTransactions();
      }
    } catch (error) {
      console.error("Transaction action error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Bulk actions
  const handleBulkAction = async () => {
    if (selectedTransactions.size === 0 || !bulkAction) return;

    setFormLoading(true);
    try {
      const response = await fetch("/api/admin/transactions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: bulkAction,
          transactionIds: Array.from(selectedTransactions),
        }),
      });

      if (response.ok) {
        await fetchTransactions();
        setSelectedTransactions(new Set());
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

  // Update transaction
  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    setFormError(null);
    setFormLoading(true);

    try {
      const response = await fetch(`/api/admin/transactions/${editingTransaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchTransactions();
        setShowEditModal(false);
        setEditingTransaction(null);
      } else {
        const data = await response.json();
        setFormError(data.error || "Failed to update transaction");
      }
    } catch (error) {
      console.error("Update transaction error:", error);
      setFormError("Failed to update transaction");
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTransaction(tx);
    setFormData({
      status: tx.status,
    });
    setShowEditModal(true);
  };

  const exportTransactions = () => {
    const csvContent = transactions
      .map((t) => `${t.id},${t.listing.title},${t.buyer.fullName},${t.seller.fullName},${t.agreedPriceGhs},${t.status}`)
      .join("\n");
    const blob = new Blob([`ID,Listing,Buyer,Seller,Amount,Status\n${csvContent}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions-export.csv";
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
            <span className="text-[#1a3a2f]">Transactions</span>
          </div>
          <h1 className="text-lg font-semibold text-[#1a3a2f]">Transaction Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">Monitor and manage all escrow transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportTransactions}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase">Total</p>
              <p className="text-lg font-bold text-[#1a3a2f]">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase">Funded</p>
              <p className="text-lg font-bold text-[#1a3a2f]">{stats.funded}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase">Released</p>
              <p className="text-lg font-bold text-[#1a3a2f]">{stats.released}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase">Disputed</p>
              <p className="text-lg font-bold text-[#1a3a2f]">{stats.disputed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase">Total Value</p>
              <p className="text-lg font-bold text-[#1a3a2f]">{formatPrice(stats.totalValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedTransactions.size > 0 && (
        <div className="bg-[#1a3a2f] text-white rounded-xl p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{selectedTransactions.size} transaction(s) selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setBulkAction("release");
                setShowBulkActionModal(true);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-medium transition-colors"
            >
              Release
            </button>
            <button
              onClick={() => {
                setBulkAction("refund");
                setShowBulkActionModal(true);
              }}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 rounded-lg text-xs font-medium transition-colors"
            >
              Refund
            </button>
            <button
              onClick={() => {
                setBulkAction("close");
                setShowBulkActionModal(true);
              }}
              className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 rounded-lg text-xs font-medium transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                setSelectedTransactions(new Set());
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
            {["all", "pending", "funded", "released", "disputed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                  filter === f
                    ? "bg-[#1a3a2f] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f}
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

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CreditCard className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm font-medium">No transactions found</p>
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
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Listing</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Buyer</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Seller</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => {
                  const statusBadge = getStatusBadge(tx.status);
                  const isSelected = selectedTransactions.has(tx.id);
                  const canRelease = ["FUNDED", "READY_TO_RELEASE"].includes(tx.status);
                  const canRefund = ["FUNDED", "DISPUTED"].includes(tx.status);

                  return (
                    <tr key={tx.id} className={`hover:bg-gray-50/50 transition-colors ${isSelected ? "bg-emerald-50/50" : ""}`}>
                      <td className="py-3 px-4">
                        <button onClick={() => toggleSelectTransaction(tx.id)} className="text-gray-400 hover:text-gray-600">
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                          {tx.id.slice(0, 8)}...
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#1a3a2f] truncate max-w-[120px]">{tx.listing.title}</p>
                          <p className="text-[10px] text-gray-400 flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5" />
                            {tx.listing.region}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-gray-400" />
                          <div>
                            <p className="text-xs text-[#1a3a2f]">{tx.buyer.fullName}</p>
                            <p className="text-[10px] text-gray-400">{tx.buyer.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-gray-400" />
                          <div>
                            <p className="text-xs text-[#1a3a2f]">{tx.seller.fullName}</p>
                            <p className="text-[10px] text-gray-400">{tx.seller.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-xs font-semibold text-emerald-600">{formatPrice(tx.agreedPriceGhs)}</p>
                        <p className="text-[10px] text-gray-400">Fee: {formatPrice(tx.platformFeeGhs)}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                        {tx.disputes.length > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-red-100 text-red-700">
                            Dispute
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">{formatDate(tx.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(tx)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          {canRelease && (
                            <button
                              onClick={() => handleTransactionAction(tx.id, "release")}
                              disabled={actionLoading === tx.id}
                              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50"
                              title="Release Funds"
                            >
                              {actionLoading === tx.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                          {canRefund && (
                            <button
                              onClick={() => handleTransactionAction(tx.id, "refund")}
                              disabled={actionLoading === tx.id}
                              className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors disabled:opacity-50"
                              title="Refund"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {tx.status !== "CLOSED" && tx.status !== "RELEASED" && tx.status !== "REFUNDED" && (
                            <button
                              onClick={() => handleTransactionAction(tx.id, "close")}
                              disabled={actionLoading === tx.id}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                              title="Close"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
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

      {/* Edit Transaction Modal */}
      {showEditModal && editingTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-[#1a3a2f]" />
                <h2 className="font-semibold text-[#1a3a2f]">Edit Transaction</h2>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateTransaction} className="p-4 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{formError}</div>
              )}
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Transaction ID</p>
                <p className="text-sm font-mono">{editingTransaction.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-sm font-semibold text-emerald-600">{formatPrice(editingTransaction.agreedPriceGhs)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Platform Fee</p>
                  <p className="text-sm font-semibold">{formatPrice(editingTransaction.platformFeeGhs)}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]"
                >
                  <option value="CREATED">Created</option>
                  <option value="ESCROW_REQUESTED">Escrow Requested</option>
                  <option value="FUNDED">Funded</option>
                  <option value="VERIFICATION_PERIOD">Verification Period</option>
                  <option value="DISPUTED">Disputed</option>
                  <option value="READY_TO_RELEASE">Ready to Release</option>
                  <option value="RELEASED">Released</option>
                  <option value="REFUNDED">Refunded</option>
                  <option value="CLOSED">Closed</option>
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

      {/* Bulk Action Confirmation Modal */}
      {showBulkActionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                bulkAction === "release" ? "bg-emerald-100" : bulkAction === "refund" ? "bg-orange-100" : "bg-gray-100"
              }`}>
                {bulkAction === "release" ? (
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                ) : bulkAction === "refund" ? (
                  <RefreshCw className="h-6 w-6 text-orange-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-gray-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 capitalize">
                {bulkAction} {selectedTransactions.size} Transaction(s)?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {bulkAction === "release"
                  ? "This will release funds to the sellers."
                  : bulkAction === "refund"
                  ? "This will refund funds to the buyers."
                  : "This will close the selected transactions."}
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
                    bulkAction === "release"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : bulkAction === "refund"
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-gray-600 hover:bg-gray-700"
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
