"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  FileText,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  Eye,
  Heart,
  Send,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

type ActivityType =
  | "listing_created"
  | "listing_published"
  | "listing_viewed"
  | "offer_received"
  | "offer_sent"
  | "offer_accepted"
  | "offer_rejected"
  | "transaction_created"
  | "transaction_funded"
  | "transaction_released"
  | "message_received"
  | "verification_requested"
  | "verification_completed"
  | "favorite_added";

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: Date;
  link?: string;
  user?: {
    name: string;
    avatar?: string;
  };
  metadata?: Record<string, any>;
}

interface ActivityFeedProps {
  activities: Activity[];
  showViewAll?: boolean;
  viewAllLink?: string;
  className?: string;
}

const activityConfig: Record<
  ActivityType,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  listing_created: { icon: FileText, color: "text-blue-600", bgColor: "bg-blue-100" },
  listing_published: { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100" },
  listing_viewed: { icon: Eye, color: "text-gray-600", bgColor: "bg-gray-100" },
  offer_received: { icon: FileText, color: "text-purple-600", bgColor: "bg-purple-100" },
  offer_sent: { icon: Send, color: "text-blue-600", bgColor: "bg-blue-100" },
  offer_accepted: { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100" },
  offer_rejected: { icon: XCircle, color: "text-red-600", bgColor: "bg-red-100" },
  transaction_created: { icon: CreditCard, color: "text-amber-600", bgColor: "bg-amber-100" },
  transaction_funded: { icon: CreditCard, color: "text-green-600", bgColor: "bg-green-100" },
  transaction_released: { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100" },
  message_received: { icon: MessageSquare, color: "text-purple-600", bgColor: "bg-purple-100" },
  verification_requested: { icon: Clock, color: "text-amber-600", bgColor: "bg-amber-100" },
  verification_completed: { icon: ShieldCheck, color: "text-green-600", bgColor: "bg-green-100" },
  favorite_added: { icon: Heart, color: "text-red-600", bgColor: "bg-red-100" },
};

function ActivityFeed({
  activities,
  showViewAll = true,
  viewAllLink = "/dashboard/activity",
  className,
}: ActivityFeedProps) {
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className={cn("bg-white rounded-xl border border-gray-100", className)}>
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Recent Activity</h3>
      </div>

      <div className="divide-y divide-gray-50">
        {activities.length === 0 ? (
          <div className="py-12 text-center">
            <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => {
            const config = activityConfig[activity.type];
            const Icon = config.icon;

            return (
              <div key={activity.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex gap-3">
                  {activity.user ? (
                    <Avatar
                      src={activity.user.avatar}
                      fallback={activity.user.name}
                      size="sm"
                    />
                  ) : (
                    <div
                      className={cn(
                        "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
                        config.bgColor
                      )}
                    >
                      <Icon className={cn("h-4 w-4", config.color)} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {activity.link ? (
                      <Link
                        href={activity.link}
                        className="text-sm font-medium text-gray-900 hover:text-green-600 transition-colors"
                      >
                        {activity.title}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                    )}
                    {activity.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {activity.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showViewAll && activities.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100">
          <Link
            href={viewAllLink}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            View all activity →
          </Link>
        </div>
      )}
    </div>
  );
}

export { ActivityFeed };
export type { Activity, ActivityType };
