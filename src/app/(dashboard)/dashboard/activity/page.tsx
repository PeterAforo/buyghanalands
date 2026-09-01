"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionCard, EmptyState } from "@/components/dashboard";
import {
  Clock,
  MessageSquare,
  DollarSign,
  FileText,
  CheckCircle,
  AlertTriangle,
  Eye,
} from "lucide-react";

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
  link?: string;
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

function getActivityIcon(type: string) {
  switch (type) {
    case "offer":
      return DollarSign;
    case "message":
      return MessageSquare;
    case "transaction":
      return CheckCircle;
    case "listing":
      return FileText;
    case "dispute":
      return AlertTriangle;
    default:
      return Clock;
  }
}

export default function ActivityPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const response = await fetch("/api/activity");
        if (response.ok) {
          const data = await response.json();
          setActivities(data);
        }
      } catch (error) {
        console.error("Failed to fetch activity:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchActivity();
    }
  }, [session]);

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!session) {
    router.push("/auth/login?callbackUrl=/dashboard/activity");
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Activity" }]}
      />

      <SectionCard title="Recent Activity">
        {activities.length === 0 ? (
          <EmptyState
            icon={<Clock className="h-7 w-7" />}
            title="No recent activity"
            description="Your activity will appear here"
          />
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.type);

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(activity.createdAt)}
                    </p>
                  </div>
                  {activity.link && (
                    <Link href={activity.link}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
