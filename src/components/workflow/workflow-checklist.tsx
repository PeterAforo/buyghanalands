"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Check,
  Circle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Upload,
  FileText,
  Users,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED" | "BLOCKED";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface ChecklistTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  isMandatory: boolean;
  warningMessage?: string;
  helpText?: string;
  estimatedDuration?: string;
  completedAt?: Date;
  
  // Action types
  actionType?: "link" | "upload" | "form" | "professional" | "date" | "custom";
  actionLabel?: string;
  actionHref?: string;
  
  // Document requirements
  requiredDocuments?: string[];
  uploadedDocuments?: { name: string; url: string }[];
  
  // Sub-tasks
  subTasks?: {
    id: string;
    title: string;
    completed: boolean;
  }[];
  
  // Professional link
  linkedProfessionalType?: string;
  linkedProfessionalId?: string;
}

interface WorkflowChecklistProps {
  title: string;
  description?: string;
  tasks: ChecklistTask[];
  onTaskToggle?: (taskId: string, completed: boolean) => void;
  onTaskAction?: (taskId: string, actionType: string) => void;
  onSubTaskToggle?: (taskId: string, subTaskId: string, completed: boolean) => void;
  showProgress?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

const statusConfig: Record<TaskStatus, { icon: React.ElementType; color: string; bgColor: string }> = {
  PENDING: {
    icon: Circle,
    color: "text-gray-400",
    bgColor: "bg-gray-50",
  },
  IN_PROGRESS: {
    icon: Circle,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
  },
  COMPLETED: {
    icon: Check,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  SKIPPED: {
    icon: Circle,
    color: "text-gray-300",
    bgColor: "bg-gray-50",
  },
  BLOCKED: {
    icon: AlertTriangle,
    color: "text-red-500",
    bgColor: "bg-red-50",
  },
};

const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
  LOW: { label: "Low", color: "text-gray-500" },
  MEDIUM: { label: "Medium", color: "text-blue-600" },
  HIGH: { label: "High", color: "text-amber-600" },
  CRITICAL: { label: "Critical", color: "text-red-600" },
};

function WorkflowChecklist({
  title,
  description,
  tasks,
  onTaskToggle,
  onTaskAction,
  onSubTaskToggle,
  showProgress = true,
  collapsible = false,
  defaultExpanded = true,
  className,
}: WorkflowChecklistProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const [expandedTasks, setExpandedTasks] = React.useState<Set<string>>(new Set());

  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const getActionIcon = (actionType?: string) => {
    switch (actionType) {
      case "link":
        return ExternalLink;
      case "upload":
        return Upload;
      case "form":
        return FileText;
      case "professional":
        return Users;
      case "date":
        return Calendar;
      default:
        return ExternalLink;
    }
  };

  return (
    <div className={cn("bg-white rounded-xl border border-gray-200", className)}>
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between p-4 border-b border-gray-100",
          collapsible && "cursor-pointer hover:bg-gray-50"
        )}
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {showProgress && (
              <span className="text-sm text-gray-500">
                ({completedCount}/{tasks.length})
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {showProgress && (
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-600">{progress}%</span>
            </div>
          )}

          {collapsible && (
            isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )
          )}
        </div>
      </div>

      {/* Tasks */}
      {(!collapsible || isExpanded) && (
        <div className="divide-y divide-gray-50">
          {tasks.map((task) => {
            const config = statusConfig[task.status];
            const StatusIcon = config.icon;
            const isTaskExpanded = expandedTasks.has(task.id);
            const hasDetails = task.helpText || task.subTasks || task.requiredDocuments;
            const ActionIcon = getActionIcon(task.actionType);

            return (
              <div key={task.id} className="p-4">
                {/* Main Task Row */}
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => onTaskToggle?.(task.id, task.status !== "COMPLETED")}
                    disabled={task.status === "BLOCKED"}
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                      task.status === "COMPLETED"
                        ? "bg-green-500 text-white"
                        : "border-2 border-gray-300 hover:border-green-500",
                      task.status === "BLOCKED" && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {task.status === "COMPLETED" && <Check className="h-4 w-4" />}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "font-medium",
                              task.status === "COMPLETED"
                                ? "text-gray-500 line-through"
                                : "text-gray-900"
                            )}
                          >
                            {task.title}
                          </span>
                          {task.isMandatory && (
                            <span className="text-xs font-medium text-red-500">Required</span>
                          )}
                          {task.priority === "CRITICAL" && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded">
                              CRITICAL
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>
                        )}

                        {/* Warning Message */}
                        {task.warningMessage && task.status !== "COMPLETED" && (
                          <div className="flex items-start gap-2 mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700">{task.warningMessage}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      {task.actionType && task.status !== "COMPLETED" && (
                        <Button
                          size="sm"
                          variant={task.actionType === "professional" ? "default" : "outline"}
                          onClick={() => onTaskAction?.(task.id, task.actionType!)}
                          className="flex-shrink-0"
                        >
                          <ActionIcon className="h-4 w-4 mr-1" />
                          {task.actionLabel || "Action"}
                        </Button>
                      )}
                    </div>

                    {/* Expand/Collapse for details */}
                    {hasDetails && (
                      <button
                        onClick={() => toggleTaskExpanded(task.id)}
                        className="flex items-center gap-1 mt-2 text-xs text-gray-500 hover:text-gray-700"
                      >
                        {isTaskExpanded ? (
                          <>
                            <ChevronUp className="h-3 w-3" />
                            Hide details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" />
                            Show details
                          </>
                        )}
                      </button>
                    )}

                    {/* Expanded Details */}
                    {isTaskExpanded && (
                      <div className="mt-3 space-y-3">
                        {/* Help Text */}
                        {task.helpText && (
                          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                            <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-700">{task.helpText}</p>
                          </div>
                        )}

                        {/* Sub-tasks */}
                        {task.subTasks && task.subTasks.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-500 uppercase">
                              Sub-tasks
                            </p>
                            {task.subTasks.map((subTask) => (
                              <label
                                key={subTask.id}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={subTask.completed}
                                  onChange={(e) =>
                                    onSubTaskToggle?.(task.id, subTask.id, e.target.checked)
                                  }
                                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                <span
                                  className={cn(
                                    "text-sm",
                                    subTask.completed
                                      ? "text-gray-400 line-through"
                                      : "text-gray-700"
                                  )}
                                >
                                  {subTask.title}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}

                        {/* Required Documents */}
                        {task.requiredDocuments && task.requiredDocuments.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-500 uppercase">
                              Required Documents
                            </p>
                            <ul className="space-y-1">
                              {task.requiredDocuments.map((doc, index) => {
                                const isUploaded = task.uploadedDocuments?.some(
                                  (d) => d.name.toLowerCase().includes(doc.toLowerCase())
                                );
                                return (
                                  <li
                                    key={index}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    {isUploaded ? (
                                      <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Circle className="h-4 w-4 text-gray-300" />
                                    )}
                                    <span
                                      className={
                                        isUploaded ? "text-gray-500" : "text-gray-700"
                                      }
                                    >
                                      {doc}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}

                        {/* Uploaded Documents */}
                        {task.uploadedDocuments && task.uploadedDocuments.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-500 uppercase">
                              Uploaded Documents
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {task.uploadedDocuments.map((doc, index) => (
                                <a
                                  key={index}
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700"
                                >
                                  <FileText className="h-3 w-3" />
                                  {doc.name}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Completion info */}
                    {task.status === "COMPLETED" && task.completedAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        Completed on{" "}
                        {new Date(task.completedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}

                    {/* Duration estimate */}
                    {task.estimatedDuration && task.status !== "COMPLETED" && (
                      <p className="text-xs text-gray-400 mt-1">
                        Est. duration: {task.estimatedDuration}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { WorkflowChecklist };
export type { ChecklistTask, TaskStatus, TaskPriority };
