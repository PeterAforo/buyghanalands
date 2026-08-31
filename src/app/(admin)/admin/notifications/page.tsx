"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Bell, Users } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: any;
  read: boolean;
  createdAt: string;
  user: { id: true; fullName: string } | null;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const readColors: Record<string, string> = {
  false: "bg-amber-100 text-amber-700",
  true: "bg-teal-100 text-teal-700",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [targetType, setTargetType] = useState("ALL");
  const [targetValue, setTargetValue] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/notifications");
        if (res.ok) setNotifications(await res.json());
      } catch { } finally { setLoading(false); }
    }
    load();
  }, []);

  async function handleSend() {
    if (!title || !body) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, actionUrl, targetType, targetValue }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.message);
        setTitle("");
        setBody("");
        setActionUrl("");
        setTargetType("ALL");
        setTargetValue("");
        // Reload
        const listRes = await fetch("/api/admin/notifications");
        if (listRes.ok) setNotifications(await listRes.json());
      } else {
        setResult(data.error || "Failed to send");
      }
    } catch {
      setResult("Failed to send notification");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-500 mt-1">Broadcast and target push notifications to users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5" /> Compose Notification</CardTitle>
            <CardDescription>Send a push notification to all or targeted users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title" className="mt-1" maxLength={200} />
            </div>
            <div>
              <label className="text-sm font-medium">Body</label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Notification message..." className="mt-1" rows={3} maxLength={500} />
            </div>
            <div>
              <label className="text-sm font-medium">Action URL (optional)</label>
              <Input value={actionUrl} onChange={(e) => setActionUrl(e.target.value)} placeholder="https://..." className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Target Audience</label>
              <select value={targetType} onChange={(e) => setTargetType(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]">
                <option value="ALL">All Active Users</option>
                <option value="ROLE">By Role</option>
                <option value="REGION">By Region</option>
                <option value="KYC_STATUS">By KYC Status</option>
              </select>
            </div>
            {targetType !== "ALL" && (
              <div>
                <label className="text-sm font-medium">
                  {targetType === "ROLE" ? "Role (SELLER, BUYER, AGENT, etc.)" :
                   targetType === "REGION" ? "Region (e.g. Greater Accra)" :
                   "KYC Tier (TIER_1_ID_UPLOAD, TIER_2_GHANA_CARD)"}
                </label>
                <Input value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder="Target value" className="mt-1" />
              </div>
            )}
            <Button onClick={handleSend} disabled={sending || !title || !body}
              className="w-full bg-[#1a3a2f] hover:bg-[#2a4a3f] gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Notification
            </Button>
            {result && (
              <div className={`text-sm p-3 rounded-lg ${result.includes("sent to") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {result}
              </div>
            )}
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#1a3a2f]" /></div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Users className="h-10 w-10 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No notifications sent yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="border-b pb-3 last:border-0">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium">{n.title}</p>
                      <Badge variant="outline" className={readColors[String(n.read)] || ""}>{n.read ? "Read" : "Unread"}</Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{n.body}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {n.user?.fullName ? `To: ${n.user.fullName}` : "Broadcast"} • {formatDate(n.createdAt)}
                    </p>
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
