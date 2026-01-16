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
  Clock,
  CheckCircle,
  Send,
  Loader2,
  User,
  Shield,
  MessageSquare,
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
    buyer: { id: string; fullName: string };
    seller: { id: string; fullName: string };
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
    RESOLVED_BUYER: { label: "Resolved (Buyer Favored)", variant: "success" },
    RESOLVED_SELLER: { label: "Resolved (Seller Favored)", variant: "success" },
    RESOLVED_SPLIT: { label: "Resolved (Split)", variant: "success" },
    CLOSED: { label: "Closed", variant: "secondary" },
  };
  return statusMap[status] || { label: status, variant: "secondary" as const };
}

export default function DisputeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status: authStatus } = useSession();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const disputeId = params.id as string;

  useEffect(() => {
    async function fetchDispute() {
      try {
        const response = await fetch(`/api/disputes/${disputeId}`);
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
      const response = await fetch(`/api/disputes/${disputeId}/messages`, {
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

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!session) {
    router.push("/auth/login");
    return null;
  }

  if (!dispute) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4">
          <p className="text-center text-gray-500">Dispute not found</p>
        </div>
      </div>
    );
  }

  const isBuyer = dispute.transaction.buyerId === session.user?.id;
  const isSeller = dispute.transaction.sellerId === session.user?.id;
  const statusBadge = getStatusBadge(dispute.status);
  const imageUrl = dispute.transaction.listing.media[0]?.url || "/placeholder-land.jpg";
  const isActive = ["OPEN", "UNDER_REVIEW"].includes(dispute.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/disputes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Disputes
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Dispute Details</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
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
                        <p className="text-emerald-600 font-medium">
                          {formatPrice(dispute.transaction.agreedPriceGhs)}
                        </p>
                      </div>
                      <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
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
                  Dispute Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-gray-900">{dispute.summary}</p>
                {dispute.description && (
                  <p className="text-gray-600 mt-2">{dispute.description}</p>
                )}
              </CardContent>
            </Card>

            {/* Resolution (if resolved) */}
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

            {/* Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-emerald-600" />
                  Discussion
                </CardTitle>
                <CardDescription>
                  Communicate with the other party and our support team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                  {dispute.messages.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No messages yet. Start the conversation below.
                    </p>
                  ) : (
                    dispute.messages.map((message) => {
                      const isOwn = message.senderId === session.user?.id;
                      const isAdmin = message.senderType === "ADMIN";

                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              isAdmin
                                ? "bg-purple-100 border border-purple-200"
                                : isOwn
                                ? "bg-emerald-600 text-white"
                                : "bg-gray-100"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {isAdmin ? (
                                <Shield className="h-4 w-4 text-purple-600" />
                              ) : (
                                <User className="h-4 w-4" />
                              )}
                              <span className={`text-xs font-medium ${isOwn && !isAdmin ? "text-emerald-100" : "text-gray-600"}`}>
                                {isAdmin ? "Support Team" : message.sender?.fullName || (isOwn ? "You" : "Other Party")}
                              </span>
                            </div>
                            <p className={isOwn && !isAdmin ? "text-white" : "text-gray-800"}>
                              {message.content}
                            </p>
                            <p className={`text-xs mt-1 ${isOwn && !isAdmin ? "text-emerald-100" : "text-gray-500"}`}>
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {isActive && (
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your message..."
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
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Parties */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Parties Involved</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Buyer</p>
                  <p className="font-medium">{dispute.transaction.buyer.fullName}</p>
                  {dispute.raisedById === dispute.transaction.buyerId && (
                    <Badge variant="outline" className="mt-1 text-xs">Raised Dispute</Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Seller</p>
                  <p className="font-medium">{dispute.transaction.seller.fullName}</p>
                  {dispute.raisedById === dispute.transaction.sellerId && (
                    <Badge variant="outline" className="mt-1 text-xs">Raised Dispute</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <span>Opened: {formatDate(dispute.createdAt)}</span>
                  </div>
                  {dispute.status === "UNDER_REVIEW" && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-yellow-500" />
                      <span>Under Review</span>
                    </div>
                  )}
                  {dispute.resolvedAt && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>Resolved: {formatDate(dispute.resolvedAt)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-600" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Our support team typically responds within 24-48 hours. 
                  Please provide all relevant evidence and documentation.
                </p>
                <Link href="/contact">
                  <Button variant="outline" className="w-full mt-4">
                    Contact Support
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
