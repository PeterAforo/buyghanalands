"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Search,
  MapPin,
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
  AlertTriangle,
  Download,
  XCircle,
  Star,
  Image as ImageIcon,
} from "lucide-react";

interface Listing {
  id: string;
  title: string;
  status: string;
  region: string;
  district: string;
  town: string;
  priceGhs: string;
  sizeAcres: string;
  landType: string;
  verificationLevel: string;
  isFeatured: boolean;
  createdAt: string;
  seller: {
    id: string;
    fullName: string;
    phone: string;
    kycTier: string;
  };
  media: { url: string }[];
}

function formatPrice(price: string | number) {
  const num = typeof price === "string" ? parseInt(price) : price;
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
    DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-600" },
    SUBMITTED: { label: "Submitted", color: "bg-blue-100 text-blue-700" },
    UNDER_REVIEW: { label: "Under Review", color: "bg-amber-100 text-amber-700" },
    PUBLISHED: { label: "Published", color: "bg-emerald-100 text-emerald-700" },
    SUSPENDED: { label: "Suspended", color: "bg-red-100 text-red-700" },
    REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700" },
    SOLD: { label: "Sold", color: "bg-purple-100 text-purple-700" },
  };
  return statusMap[status] || { label: status, color: "bg-gray-100 text-gray-600" };
}

function getVerificationBadge(level: string) {
  const levelMap: Record<string, { label: string; color: string }> = {
    NONE: { label: "None", color: "bg-gray-100 text-gray-600" },
    BASIC: { label: "Basic", color: "bg-blue-100 text-blue-700" },
    VERIFIED: { label: "Verified", color: "bg-emerald-100 text-emerald-700" },
    PREMIUM: { label: "Premium", color: "bg-purple-100 text-purple-700" },
  };
  return levelMap[level] || { label: level, color: "bg-gray-100 text-gray-600" };
}

export default function AdminListingsPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("pending");
  const [search, setSearch] = useState("");

  // Selection state
  const [selectedListings, setSelectedListings] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [deleteListingId, setDeleteListingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    status: "",
    verificationLevel: "",
    isFeatured: false,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchListings = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/listings?filter=${filter}&search=${search}`);
      if (response.ok) {
        const data = await response.json();
        setListings(data);
      }
    } catch (error) {
      console.error("Failed to fetch listings:", error);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    if (session?.user) {
      fetchListings();
    }
  }, [session, fetchListings]);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedListings(new Set());
    } else {
      setSelectedListings(new Set(listings.map((l) => l.id)));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelectListing = (listingId: string) => {
    const newSelected = new Set(selectedListings);
    if (newSelected.has(listingId)) {
      newSelected.delete(listingId);
    } else {
      newSelected.add(listingId);
    }
    setSelectedListings(newSelected);
    setSelectAll(newSelected.size === listings.length);
  };

  // Single listing moderation
  const handleModerate = async (listingId: string, action: "approve" | "reject" | "suspend" | "reinstate") => {
    setActionLoading(listingId);
    try {
      const response = await fetch(`/api/admin/listings/${listingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        await fetchListings();
      }
    } catch (error) {
      console.error("Moderation error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Bulk actions
  const handleBulkAction = async () => {
    if (selectedListings.size === 0 || !bulkAction) return;

    setFormLoading(true);
    try {
      const response = await fetch("/api/admin/listings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: bulkAction,
          listingIds: Array.from(selectedListings),
        }),
      });

      if (response.ok) {
        await fetchListings();
        setSelectedListings(new Set());
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

  // Update listing
  const handleUpdateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListing) return;

    setFormError(null);
    setFormLoading(true);

    try {
      const response = await fetch(`/api/admin/listings/${editingListing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchListings();
        setShowEditModal(false);
        setEditingListing(null);
      } else {
        const data = await response.json();
        setFormError(data.error || "Failed to update listing");
      }
    } catch (error) {
      console.error("Update listing error:", error);
      setFormError("Failed to update listing");
    } finally {
      setFormLoading(false);
    }
  };

  // Delete listing
  const handleDeleteListing = async () => {
    if (!deleteListingId) return;

    setFormLoading(true);
    try {
      const response = await fetch(`/api/admin/listings/${deleteListingId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchListings();
        setShowDeleteModal(false);
        setDeleteListingId(null);
      } else {
        const data = await response.json();
        setFormError(data.error || "Failed to delete listing");
      }
    } catch (error) {
      console.error("Delete listing error:", error);
      setFormError("Failed to delete listing");
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (listing: Listing) => {
    setEditingListing(listing);
    setFormData({
      title: listing.title,
      status: listing.status,
      verificationLevel: listing.verificationLevel,
      isFeatured: listing.isFeatured,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (listingId: string) => {
    setDeleteListingId(listingId);
    setShowDeleteModal(true);
  };

  const exportListings = () => {
    const csvContent = listings
      .map((l) => `${l.title},${l.region},${l.district},${l.priceGhs},${l.status},${l.seller.fullName}`)
      .join("\n");
    const blob = new Blob([`Title,Region,District,Price,Status,Seller\n${csvContent}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "listings-export.csv";
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
            <span className="text-[#1a3a2f]">Listings</span>
          </div>
          <h1 className="text-lg font-semibold text-[#1a3a2f]">Listing Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">Review, moderate, and manage all property listings</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportListings}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedListings.size > 0 && (
        <div className="bg-[#1a3a2f] text-white rounded-xl p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{selectedListings.size} listing(s) selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setBulkAction("approve");
                setShowBulkActionModal(true);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-medium transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => {
                setBulkAction("reject");
                setShowBulkActionModal(true);
              }}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-medium transition-colors"
            >
              Reject
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
                setSelectedListings(new Set());
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
            {["pending", "published", "suspended", "rejected", "all"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                  filter === f
                    ? "bg-[#1a3a2f] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f === "pending" ? "Pending Review" : f}
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

      {/* Listings Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {listings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <MapPin className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm font-medium">No listings found</p>
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
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Listing</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Seller</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Verification</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {listings.map((listing) => {
                  const statusBadge = getStatusBadge(listing.status);
                  const verificationBadge = getVerificationBadge(listing.verificationLevel);
                  const isSelected = selectedListings.has(listing.id);
                  const isPending = ["SUBMITTED", "UNDER_REVIEW"].includes(listing.status);

                  return (
                    <tr key={listing.id} className={`hover:bg-gray-50/50 transition-colors ${isSelected ? "bg-emerald-50/50" : ""}`}>
                      <td className="py-3 px-4">
                        <button onClick={() => toggleSelectListing(listing.id)} className="text-gray-400 hover:text-gray-600">
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-10 h-10 rounded-lg bg-cover bg-center flex-shrink-0 bg-gray-100 flex items-center justify-center"
                            style={{
                              backgroundImage: listing.media[0]?.url ? `url(${listing.media[0].url})` : undefined,
                            }}
                          >
                            {!listing.media[0]?.url && <ImageIcon className="h-4 w-4 text-gray-400" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="font-medium text-[#1a3a2f] text-sm truncate max-w-[150px]">{listing.title}</p>
                              {listing.isFeatured && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                            </div>
                            <p className="text-[10px] text-gray-400">{listing.landType} • {listing.sizeAcres} acres</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-xs font-medium text-[#1a3a2f]">{listing.seller.fullName}</p>
                        <p className="text-[10px] text-gray-400">{listing.seller.phone}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-xs text-[#1a3a2f]">{listing.district}</p>
                        <p className="text-[10px] text-gray-400">{listing.region}</p>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-[#1a3a2f]">{formatPrice(listing.priceGhs)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${verificationBadge.color}`}>
                          {verificationBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">{formatDate(listing.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/listings/${listing.id}`}
                            target="_blank"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => openEditModal(listing)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleModerate(listing.id, "approve")}
                                disabled={actionLoading === listing.id}
                                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50"
                                title="Approve"
                              >
                                {actionLoading === listing.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleModerate(listing.id, "reject")}
                                disabled={actionLoading === listing.id}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                title="Reject"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          {listing.status === "PUBLISHED" && (
                            <button
                              onClick={() => handleModerate(listing.id, "suspend")}
                              disabled={actionLoading === listing.id}
                              className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors disabled:opacity-50"
                              title="Suspend"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {listing.status === "SUSPENDED" && (
                            <button
                              onClick={() => handleModerate(listing.id, "reinstate")}
                              disabled={actionLoading === listing.id}
                              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50"
                              title="Reinstate"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => openDeleteModal(listing.id)}
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

      {/* Edit Listing Modal */}
      {showEditModal && editingListing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-[#1a3a2f]" />
                <h2 className="font-semibold text-[#1a3a2f]">Edit Listing</h2>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateListing} className="p-4 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{formError}</div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="SOLD">Sold</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Verification Level</label>
                <select
                  value={formData.verificationLevel}
                  onChange={(e) => setFormData({ ...formData, verificationLevel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]"
                >
                  <option value="NONE">None</option>
                  <option value="BASIC">Basic</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="PREMIUM">Premium</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-[#1a3a2f] focus:ring-[#1a3a2f]"
                />
                <label htmlFor="isFeatured" className="text-sm text-gray-700">Featured Listing</label>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Listing?</h3>
              <p className="text-sm text-gray-600 mb-6">
                This will suspend the listing. The seller will need to resubmit for review.
              </p>
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg mb-4">{formError}</div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteListingId(null);
                    setFormError(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteListing}
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
                bulkAction === "reject" || bulkAction === "suspend" ? "bg-red-100" : "bg-emerald-100"
              }`}>
                {bulkAction === "approve" ? (
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                ) : bulkAction === "reject" ? (
                  <XCircle className="h-6 w-6 text-red-600" />
                ) : (
                  <Ban className="h-6 w-6 text-orange-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 capitalize">
                {bulkAction} {selectedListings.size} Listing(s)?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {bulkAction === "approve"
                  ? "This will publish the selected listings."
                  : bulkAction === "reject"
                  ? "This will reject the selected listings."
                  : "This will suspend the selected listings."}
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
                    bulkAction === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : bulkAction === "reject"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-orange-600 hover:bg-orange-700"
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
