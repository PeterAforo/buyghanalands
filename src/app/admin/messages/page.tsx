"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Search,
  MessageSquare,
  User,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface Conversation {
  id: string;
  listing: {
    id: string;
    title: string;
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
  lastMessageAt: string;
  _count: {
    messages: number;
  };
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminMessagesPage() {
  const { data: session, status: authStatus } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchConversations() {
      try {
        const response = await fetch(`/api/admin/messages?search=${search}`);
        if (response.ok) {
          const data = await response.json();
          setConversations(data);
        }
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchConversations();
    }
  }, [session, search]);

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Admin
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Message Monitoring</h1>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by user name or listing..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversations List */}
        <Card>
          <CardHeader>
            <CardTitle>All Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            {conversations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No conversations found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium">{conv.listing.title}</span>
                        <Badge variant="secondary">{conv._count.messages} messages</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Buyer: {conv.buyer.fullName}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Seller: {conv.seller.fullName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <Clock className="h-3 w-3" />
                        Last message: {formatDate(conv.lastMessageAt)}
                      </div>
                    </div>
                    <Link href={`/admin/messages/${conv.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
