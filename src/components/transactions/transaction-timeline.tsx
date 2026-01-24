"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  Check, 
  Clock, 
  AlertCircle, 
  XCircle,
  FileText,
  CreditCard,
  Shield,
  CheckCircle,
  Banknote,
  AlertTriangle,
} from "lucide-react";

type TransactionStatus = 
  | "CREATED"
  | "ESCROW_REQUESTED"
  | "FUNDED"
  | "VERIFICATION_PERIOD"
  | "DISPUTED"
  | "READY_TO_RELEASE"
  | "RELEASED"
  | "REFUNDED"
  | "PARTIAL_SETTLED"
  | "CLOSED";

interface TransactionTimelineProps {
  currentStatus: TransactionStatus;
  createdAt: Date;
  fundedAt?: Date;
  releasedAt?: Date;
  closedAt?: Date;
  className?: string;
}

const STATUS_CONFIG: Record<TransactionStatus, { 
  label: string; 
  description: string;
  icon: React.ElementType;
  color: string;
}> = {
  CREATED: {
    label: "Transaction Created",
    description: "Offer accepted, transaction initiated",
    icon: FileText,
    color: "text-blue-600 bg-blue-100",
  },
  ESCROW_REQUESTED: {
    label: "Escrow Requested",
    description: "Waiting for buyer to fund escrow",
    icon: Shield,
    color: "text-amber-600 bg-amber-100",
  },
  FUNDED: {
    label: "Escrow Funded",
    description: "Funds secured in escrow account",
    icon: CreditCard,
    color: "text-green-600 bg-green-100",
  },
  VERIFICATION_PERIOD: {
    label: "Verification Period",
    description: "7-day verification window active",
    icon: Clock,
    color: "text-purple-600 bg-purple-100",
  },
  DISPUTED: {
    label: "Disputed",
    description: "Transaction under dispute review",
    icon: AlertTriangle,
    color: "text-red-600 bg-red-100",
  },
  READY_TO_RELEASE: {
    label: "Ready to Release",
    description: "Verification complete, awaiting release",
    icon: CheckCircle,
    color: "text-green-600 bg-green-100",
  },
  RELEASED: {
    label: "Funds Released",
    description: "Payment released to seller",
    icon: Banknote,
    color: "text-green-600 bg-green-100",
  },
  REFUNDED: {
    label: "Refunded",
    description: "Funds returned to buyer",
    icon: XCircle,
    color: "text-gray-600 bg-gray-100",
  },
  PARTIAL_SETTLED: {
    label: "Partial Settlement",
    description: "Funds partially distributed",
    icon: AlertCircle,
    color: "text-amber-600 bg-amber-100",
  },
  CLOSED: {
    label: "Completed",
    description: "Transaction successfully closed",
    icon: Check,
    color: "text-green-600 bg-green-100",
  },
};

const TIMELINE_STEPS: TransactionStatus[] = [
  "CREATED",
  "ESCROW_REQUESTED",
  "FUNDED",
  "VERIFICATION_PERIOD",
  "READY_TO_RELEASE",
  "RELEASED",
  "CLOSED",
];

function TransactionTimeline({
  currentStatus,
  createdAt,
  fundedAt,
  releasedAt,
  closedAt,
  className,
}: TransactionTimelineProps) {
  const currentStepIndex = TIMELINE_STEPS.indexOf(currentStatus);
  const isDisputed = currentStatus === "DISPUTED";
  const isRefunded = currentStatus === "REFUNDED";

  const getStepStatus = (stepIndex: number): "completed" | "current" | "pending" => {
    if (isDisputed || isRefunded) {
      if (stepIndex < currentStepIndex) return "completed";
      return "pending";
    }
    if (stepIndex < currentStepIndex) return "completed";
    if (stepIndex === currentStepIndex) return "current";
    return "pending";
  };

  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 p-6", className)}>
      <h3 className="font-semibold text-gray-900 mb-6">Transaction Progress</h3>

      {/* Special Status Banner */}
      {(isDisputed || isRefunded) && (
        <div className={cn(
          "mb-6 p-4 rounded-lg flex items-center gap-3",
          isDisputed ? "bg-red-50 border border-red-200" : "bg-gray-50 border border-gray-200"
        )}>
          {isDisputed ? (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          ) : (
            <XCircle className="h-5 w-5 text-gray-600" />
          )}
          <div>
            <p className={cn("font-medium", isDisputed ? "text-red-700" : "text-gray-700")}>
              {STATUS_CONFIG[currentStatus].label}
            </p>
            <p className="text-sm text-gray-600">
              {STATUS_CONFIG[currentStatus].description}
            </p>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {TIMELINE_STEPS.map((step, index) => {
          const config = STATUS_CONFIG[step];
          const status = getStepStatus(index);
          const Icon = config.icon;
          const isLast = index === TIMELINE_STEPS.length - 1;

          return (
            <div key={step} className="relative flex gap-4">
              {/* Line */}
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-5 top-10 w-0.5 h-full -ml-px",
                    status === "completed" ? "bg-green-500" : "bg-gray-200"
                  )}
                />
              )}

              {/* Icon */}
              <div
                className={cn(
                  "relative z-10 flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0",
                  status === "completed" && "bg-green-500 text-white",
                  status === "current" && config.color,
                  status === "pending" && "bg-gray-100 text-gray-400"
                )}
              >
                {status === "completed" ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>

              {/* Content */}
              <div className={cn("pb-8", isLast && "pb-0")}>
                <p
                  className={cn(
                    "font-medium",
                    status === "completed" && "text-green-700",
                    status === "current" && "text-gray-900",
                    status === "pending" && "text-gray-400"
                  )}
                >
                  {config.label}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{config.description}</p>
                
                {/* Timestamps */}
                {step === "CREATED" && createdAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
                {step === "FUNDED" && fundedAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(fundedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
                {step === "RELEASED" && releasedAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(releasedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
                {step === "CLOSED" && closedAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(closedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { TransactionTimeline };
export type { TransactionStatus };
