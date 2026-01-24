"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Bell,
  Clock,
  Info,
  X,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type AlertType = "warning" | "reminder" | "deadline" | "info" | "success";

interface WorkflowAlertItem {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  module?: string;
  stage?: number;
  taskId?: string;
  triggerDate?: Date;
  dueDate?: Date;
  isRead: boolean;
  isDismissed: boolean;
  actionLabel?: string;
  actionHref?: string;
  createdAt: Date;
}

interface WorkflowAlertsProps {
  alerts: WorkflowAlertItem[];
  onMarkAsRead?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
  onAction?: (alertId: string) => void;
  showDismissed?: boolean;
  maxVisible?: number;
  className?: string;
}

const alertConfig: Record<
  AlertType,
  { icon: React.ElementType; bgColor: string; borderColor: string; iconColor: string }
> = {
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    iconColor: "text-amber-600",
  },
  reminder: {
    icon: Bell,
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    iconColor: "text-blue-600",
  },
  deadline: {
    icon: Clock,
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    iconColor: "text-red-600",
  },
  info: {
    icon: Info,
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    iconColor: "text-gray-600",
  },
  success: {
    icon: CheckCircle,
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    iconColor: "text-green-600",
  },
};

function formatTimeAgo(date: Date): string {
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
}

function formatDueDate(date: Date): string {
  const now = new Date();
  const dueDate = new Date(date);
  const diff = dueDate.getTime() - now.getTime();
  const days = Math.ceil(diff / 86400000);

  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days < 7) return `Due in ${days} days`;
  return `Due ${dueDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })}`;
}

function WorkflowAlerts({
  alerts,
  onMarkAsRead,
  onDismiss,
  onAction,
  showDismissed = false,
  maxVisible,
  className,
}: WorkflowAlertsProps) {
  const [showAll, setShowAll] = React.useState(false);

  const visibleAlerts = React.useMemo(() => {
    let filtered = alerts.filter((a) => showDismissed || !a.isDismissed);
    
    // Sort by priority: deadlines first, then warnings, then unread, then by date
    filtered.sort((a, b) => {
      const priorityOrder: Record<AlertType, number> = {
        deadline: 0,
        warning: 1,
        reminder: 2,
        info: 3,
        success: 4,
      };
      
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      if (priorityOrder[a.type] !== priorityOrder[b.type]) {
        return priorityOrder[a.type] - priorityOrder[b.type];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    if (maxVisible && !showAll) {
      return filtered.slice(0, maxVisible);
    }
    return filtered;
  }, [alerts, showDismissed, maxVisible, showAll]);

  const unreadCount = alerts.filter((a) => !a.isRead && !a.isDismissed).length;
  const hasMore = maxVisible && alerts.filter((a) => !a.isDismissed).length > maxVisible;

  if (visibleAlerts.length === 0) {
    return (
      <div className={cn("bg-white rounded-xl border border-gray-200 p-6", className)}>
        <div className="text-center">
          <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No alerts</p>
          <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-xl border border-gray-200", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">Alerts & Reminders</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {onMarkAsRead && unreadCount > 0 && (
          <button
            onClick={() => alerts.forEach((a) => !a.isRead && onMarkAsRead(a.id))}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Alerts List */}
      <div className="divide-y divide-gray-50">
        {visibleAlerts.map((alert) => {
          const config = alertConfig[alert.type];
          const Icon = config.icon;

          return (
            <div
              key={alert.id}
              className={cn(
                "p-4 transition-colors",
                !alert.isRead && "bg-gray-50/50"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={cn(
                    "p-2 rounded-lg flex-shrink-0",
                    config.bgColor
                  )}
                >
                  <Icon className={cn("h-5 w-5", config.iconColor)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p
                        className={cn(
                          "font-medium",
                          !alert.isRead ? "text-gray-900" : "text-gray-700"
                        )}
                      >
                        {alert.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">{alert.message}</p>
                    </div>

                    {/* Dismiss Button */}
                    {onDismiss && (
                      <button
                        onClick={() => onDismiss(alert.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(alert.createdAt)}
                    </span>
                    {alert.dueDate && (
                      <span
                        className={cn(
                          "text-xs font-medium",
                          new Date(alert.dueDate) < new Date()
                            ? "text-red-600"
                            : "text-amber-600"
                        )}
                      >
                        {formatDueDate(alert.dueDate)}
                      </span>
                    )}
                    {alert.module && (
                      <span className="text-xs text-gray-400">
                        {alert.module}
                        {alert.stage && ` • Stage ${alert.stage}`}
                      </span>
                    )}
                  </div>

                  {/* Action Button */}
                  {alert.actionLabel && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => onAction?.(alert.id)}
                    >
                      {alert.actionLabel}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>

                {/* Unread Indicator */}
                {!alert.isRead && (
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Show More */}
      {hasMore && (
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-center text-sm text-green-600 hover:text-green-700 font-medium"
          >
            {showAll
              ? "Show less"
              : `Show ${alerts.filter((a) => !a.isDismissed).length - (maxVisible || 0)} more`}
          </button>
        </div>
      )}
    </div>
  );
}

// Inline Alert Banner Component
interface WorkflowAlertBannerProps {
  type: AlertType;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  className?: string;
}

function WorkflowAlertBanner({
  type,
  title,
  message,
  actionLabel,
  onAction,
  onDismiss,
  className,
}: WorkflowAlertBannerProps) {
  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", config.iconColor)} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-600 mt-0.5">{message}</p>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className={cn(
              "mt-2 text-sm font-medium",
              type === "warning" && "text-amber-700 hover:text-amber-800",
              type === "deadline" && "text-red-700 hover:text-red-800",
              type === "reminder" && "text-blue-700 hover:text-blue-800",
              type === "info" && "text-gray-700 hover:text-gray-800",
              type === "success" && "text-green-700 hover:text-green-800"
            )}
          >
            {actionLabel} →
          </button>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export { WorkflowAlerts, WorkflowAlertBanner };
export type { WorkflowAlertItem, AlertType };
