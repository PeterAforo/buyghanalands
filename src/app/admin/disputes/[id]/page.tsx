"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Send,
  Loader2,
  User,
  Shield,
  MessageSquare,
  XCircle,
  Scale,
} from "lucide-react";

interface DisputeMessage {
  id: string;
  content: string;
  senderType: "BUYER" | "SELLER" | "ADMIN";
  senderId: string;
  createdAt: string;
  sender?: {
    fullName: string;
  };
}

interface Dispute {
  id: string;
  status: string;
  summary: string;
  description: string | null;
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
  raisedById: string;
  transaction: {
    id: string;
    agreedPriceGhs: string;
    buyerId: string;
    sellerId: string;
    listing: {
      id: string;
      title: string;
      media: { url: string }[];
    };
    buyer: { id: string; fullName: string; phone: string };
    seller: { id: string; fullName: string; phone: string };
  };
  messages: DisputeMessage[];
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

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
    OPEN: { label: "Open", variant: "destructive" },
    UNDER_REVIEW: { label: "Under Review", variant: "warning" },
    RESOLVED_BUYER: { label: "Resolved (Buyer)", variant: "success" },
    RESOLVED_SELLER: { label: "Resolved (Seller)", variant: "success" },
    RESOLVED_SPLIT: { label: "Resolved (Split)", variant: "success" },
    CLOSED: { label: "Closed", variant: "secondary" },
  };
  return statusMap[status] || { label: status, variant: "secondary" as const };
}

export default function AdminDisputeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status: authStatus } = useSession();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [resolution, setResolution] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const disputeId = params.id as string;

  useEffect(() => {
    async function fetchDispute() {
      try {
        const response = await fetch(`/api/admin/disputes/${disputeId}`);
        if (response.ok) {
          const data = await response.json();
          setDispute(data);
        }
      } catch (error) {
        console.error("Failed to fetch dispute:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user && disputeId) {
      fetchDispute();
    }
  }, [session, disputeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dispute?.messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !dispute) return;

    setSending(true);
    try {
      const response = await fetch(`/api/admin/disputes/${disputeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });

      if (response.ok) {
        const message = await response.json();
        setDispute((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, message],
          };
        });
        setNewMessage("");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async (resolutionType: "RESOLVED_BUYER" | "RESOLVED_SELLER" | "RESOLVED_SPLIT") => {
    if (!resolution.trim()) {
      alert("Please provide a resolution summary");
      return;
    }

    setResolving(true);
    try {
      const response = await fetch(`/api/admin/disputes/${disputeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: resolutionType,
          resolution: resolution,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setDispute(updated);
        setResolution("");
      }
    } catch (error) {
      console.error("Failed to resolve dispute:", error);
    } finally {
      setResolving(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/disputes/${disputeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updated = await response.json();
        setDispute(updated);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="mx-auto max-w-4xl px-4">
          <p className="text-center text-gray-500">Dispute not found</p>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(dispute.status);
  const imageUrl = dispute.transaction.listing.media[0]?.url || "/placeholder-land.svg";
  const isActive = ["OPEN", "UNDER_REVIEW"].includes(dispute.status);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/disputes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Disputes
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Review Dispute</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dispute Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div
                    className="w-24 h-24 rounded-lg bg-cover bg-center flex-shrink-0"
                    style={{ backgroundImage: `url(${imageUrl})` }}
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {dispute.transaction.listing.title}
                        </h2>
                        <p className="text-emerald-600 font-medium text-xl">
                          {formatPrice(dispute.transaction.agreedPriceGhs)}
                        </p>
                      </div>
                      <Badge variant={statusBadge.variant} className="text-sm">
                        {statusBadge.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Opened on {formatDate(dispute.createdAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dispute Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Dispute Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-gray-900">{dispute.summary}</p>
                {dispute.description && (
                  <p className="text-gray-600 mt-2">{dispute.description}</p>
                )}
              </CardContent>
            </Card>

            {/* Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-emerald-600" />
                  Discussion Thread
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                  {dispute.messages.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No messages yet.
                    </p>
                  ) : (
                    dispute.messages.map((message) => {
                      const isAdmin = message.senderType === "ADMIN";
                      const isBuyer = message.senderType === "BUYER";

                      return (
                        <div key={message.id} className="flex justify-start">
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              isAdmin
                                ? "bg-purple-100 border border-purple-200"
                                : isBuyer
                                ? "bg-blue-50 border border-blue-200"
                                : "bg-orange-50 border border-orange-200"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {isAdmin ? (
                                <Shield className="h-4 w-4 text-purple-600" />
                              ) : (
                                <User className="h-4 w-4" />
                              )}
                              <span className="text-xs font-medium text-gray-600">
                                {isAdmin ? "Admin" : isBuyer ? "Buyer" : "Seller"}: {message.sender?.fullName || "Unknown"}
                              </span>
                            </div>
                            <p className="text-gray-800">{message.content}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(message.createdAt)} at {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex gap-2">
                  <Textarea
                    placeholder="Send a message to both parties..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="resize-none"
                    rows={2}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="self-end"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Resolution Panel */}
            {isActive && (
              <Card className="border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-purple-600" />
                    Resolve Dispute
                  </CardTitle>
                  <CardDescription>
                    Make a decision on this dispute
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resolution Summary
                    </label>
                    <Textarea
                      placeholder="Explain the resolution decision..."
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => handleResolve("RESOLVED_BUYER")}
                      disabled={resolving}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {resolving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Favor Buyer (Refund)
                    </Button>
                    <Button
                      onClick={() => handleResolve("RESOLVED_SELLER")}
                      disabled={resolving}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Favor Seller (Release)
                    </Button>
                    <Button
                      onClick={() => handleResolve("RESOLVED_SPLIT")}
                      disabled={resolving}
                      variant="outline"
                    >
                      Split Decision
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resolution Display */}
            {dispute.resolution && (
              <Card className="border-emerald-200 bg-emerald-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    Resolution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{dispute.resolution}</p>
                  {dispute.resolvedAt && (
                    <p className="text-sm text-gray-500 mt-2">
                      Resolved on {formatDate(dispute.resolvedAt)}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            {dispute.status === "OPEN" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={() => handleUpdateStatus("UNDER_REVIEW")}
                    className="w-full"
                    variant="outline"
                  >
                    Mark as Under Review
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Parties */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Parties Involved</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Buyer</p>
                  <p className="font-medium">{dispute.transaction.buyer.fullName}</p>
                  <p className="text-sm text-gray-500">{dispute.transaction.buyer.phone}</p>
                  {dispute.raisedById === dispute.transaction.buyerId && (
                    <Badge variant="outline" className="mt-1 text-xs">Raised Dispute</Badge>
                  )}
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-600 font-medium">Seller</p>
                  <p className="font-medium">{dispute.transaction.seller.fullName}</p>
                  <p className="text-sm text-gray-500">{dispute.transaction.seller.phone}</p>
                  {dispute.raisedById === dispute.transaction.sellerId && (
                    <Badge variant="outline" className="mt-1 text-xs">Raised Dispute</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Transaction Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-medium">{formatPrice(dispute.transaction.agreedPriceGhs)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transaction ID</span>
                    <span className="font-mono text-xs">{dispute.transaction.id.slice(0, 8)}...</span>
                  </div>
                </div>
                <Link href={`/admin/transactions/${dispute.transaction.id}`}>
                  <Button variant="outline" className="w-full mt-4" size="sm">
                    View Transaction
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
