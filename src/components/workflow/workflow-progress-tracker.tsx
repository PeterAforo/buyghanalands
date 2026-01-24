"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Check,
  Clock,
  Lock,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

type StageStatus = "LOCKED" | "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";

interface Stage {
  id: number;
  title: string;
  description?: string;
  status: StageStatus;
  progress: number;
  estimatedDuration?: string;
  tasks?: {
    total: number;
    completed: number;
  };
}

interface WorkflowProgressTrackerProps {
  title: string;
  currentStage: number;
  stages: Stage[];
  overallProgress: number;
  onStageClick?: (stageId: number) => void;
  variant?: "horizontal" | "vertical";
  className?: string;
}

const statusConfig: Record<StageStatus, { icon: React.ElementType; color: string; bgColor: string; borderColor: string }> = {
  LOCKED: {
    icon: Lock,
    color: "text-gray-400",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-200",
  },
  NOT_STARTED: {
    icon: Clock,
    color: "text-gray-500",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-300",
  },
  IN_PROGRESS: {
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-400",
  },
  COMPLETED: {
    icon: Check,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-500",
  },
  SKIPPED: {
    icon: ChevronRight,
    color: "text-gray-400",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-300",
  },
};

function WorkflowProgressTracker({
  title,
  currentStage,
  stages,
  overallProgress,
  onStageClick,
  variant = "vertical",
  className,
}: WorkflowProgressTrackerProps) {
  if (variant === "horizontal") {
    return (
      <div className={cn("bg-white rounded-xl border border-gray-200 p-6", className)}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Stage {currentStage} of {stages.length}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">{overallProgress}%</p>
            <p className="text-xs text-gray-500">Complete</p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        {/* Horizontal Stages */}
        <div className="flex items-start justify-between">
          {stages.map((stage, index) => {
            const config = statusConfig[stage.status];
            const Icon = config.icon;
            const isActive = stage.id === currentStage;
            const isClickable = stage.status !== "LOCKED" && onStageClick;

            return (
              <React.Fragment key={stage.id}>
                <div
                  className={cn(
                    "flex flex-col items-center text-center flex-1",
                    isClickable && "cursor-pointer"
                  )}
                  onClick={() => isClickable && onStageClick(stage.id)}
                >
                  {/* Stage Circle */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                      config.bgColor,
                      config.borderColor,
                      isActive && "ring-4 ring-amber-100"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", config.color)} />
                  </div>

                  {/* Stage Info */}
                  <p
                    className={cn(
                      "text-xs font-medium mt-2 max-w-[80px]",
                      isActive ? "text-gray-900" : "text-gray-500"
                    )}
                  >
                    {stage.title}
                  </p>

                  {stage.status === "IN_PROGRESS" && (
                    <p className="text-[10px] text-amber-600 mt-1">
                      {stage.progress}%
                    </p>
                  )}
                </div>

                {/* Connector Line */}
                {index < stages.length - 1 && (
                  <div className="flex-1 flex items-center px-2 pt-5">
                    <div
                      className={cn(
                        "h-0.5 w-full",
                        stage.status === "COMPLETED" ? "bg-green-500" : "bg-gray-200"
                      )}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  // Vertical variant
  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            Stage {currentStage} of {stages.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-green-600">{overallProgress}%</span>
        </div>
      </div>

      {/* Vertical Stages */}
      <div className="space-y-1">
        {stages.map((stage, index) => {
          const config = statusConfig[stage.status];
          const Icon = config.icon;
          const isActive = stage.id === currentStage;
          const isClickable = stage.status !== "LOCKED" && onStageClick;
          const isLast = index === stages.length - 1;

          return (
            <div key={stage.id} className="relative">
              {/* Connector Line */}
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-5 top-10 w-0.5 h-full -ml-px",
                    stage.status === "COMPLETED" ? "bg-green-500" : "bg-gray-200"
                  )}
                />
              )}

              {/* Stage Card */}
              <div
                className={cn(
                  "relative flex items-start gap-4 p-3 rounded-lg transition-all",
                  isActive && "bg-amber-50 border border-amber-200",
                  isClickable && "hover:bg-gray-50 cursor-pointer",
                  stage.status === "LOCKED" && "opacity-60"
                )}
                onClick={() => isClickable && onStageClick(stage.id)}
              >
                {/* Stage Circle */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0",
                    config.bgColor,
                    config.borderColor
                  )}
                >
                  <Icon className={cn("h-5 w-5", config.color)} />
                </div>

                {/* Stage Info */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center justify-between">
                    <h4
                      className={cn(
                        "font-medium",
                        isActive ? "text-gray-900" : "text-gray-700"
                      )}
                    >
                      Stage {stage.id}: {stage.title}
                    </h4>
                    {stage.status === "IN_PROGRESS" && (
                      <span className="text-sm font-medium text-amber-600">
                        {stage.progress}%
                      </span>
                    )}
                    {stage.status === "COMPLETED" && (
                      <span className="text-sm font-medium text-green-600">
                        Complete
                      </span>
                    )}
                  </div>

                  {stage.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{stage.description}</p>
                  )}

                  {/* Progress bar for in-progress stages */}
                  {stage.status === "IN_PROGRESS" && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-300"
                          style={{ width: `${stage.progress}%` }}
                        />
                      </div>
                      {stage.tasks && (
                        <p className="text-xs text-gray-500 mt-1">
                          {stage.tasks.completed}/{stage.tasks.total} tasks completed
                        </p>
                      )}
                    </div>
                  )}

                  {stage.estimatedDuration && stage.status !== "COMPLETED" && (
                    <p className="text-xs text-gray-400 mt-1">
                      Est. duration: {stage.estimatedDuration}
                    </p>
                  )}
                </div>

                {/* Arrow for clickable stages */}
                {isClickable && (
                  <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 mt-2" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { WorkflowProgressTracker };
export type { Stage, StageStatus };
