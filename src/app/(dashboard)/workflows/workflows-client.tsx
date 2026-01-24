"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Plus,
  MapPin,
  FileText,
  Bell,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Building2,
  Hammer,
  ClipboardCheck,
  Home,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Workflow {
  id: string;
  propertyTitle: string | null;
  propertyAddress: string | null;
  region: string | null;
  district: string | null;
  town: string | null;
  plotNumber: string | null;
  landSizeAcres: string | null;
  currentModule: string;
  overallStatus: string;
  overallProgress: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  listing: {
    id: string;
    title: string;
    region: string;
    district: string;
    priceGhs: string;
    image?: string;
  } | null;
  landAcquisition: {
    currentStage: number;
    status: string;
    progress: number;
  } | null;
  preConstruction: {
    currentStage: number;
    status: string;
    progress: number;
  } | null;
  buildingPermit: {
    currentStage: number;
    status: string;
    progress: number;
  } | null;
  construction: {
    currentStage: number;
    status: string;
    progress: number;
  } | null;
  _count: {
    workflowDocuments: number;
    workflowAlerts: number;
  };
}

interface WorkflowsClientProps {
  initialWorkflows: Workflow[];
}

const moduleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  LAND_ACQUISITION: {
    label: "Land Acquisition",
    icon: MapPin,
    color: "text-blue-600 bg-blue-100",
  },
  PRE_CONSTRUCTION: {
    label: "Pre-Construction",
    icon: ClipboardCheck,
    color: "text-purple-600 bg-purple-100",
  },
  BUILDING_PERMIT: {
    label: "Building Permit",
    icon: FileText,
    color: "text-amber-600 bg-amber-100",
  },
  CONSTRUCTION: {
    label: "Construction",
    icon: Hammer,
    color: "text-orange-600 bg-orange-100",
  },
  COMPLETION: {
    label: "Completion",
    icon: Home,
    color: "text-green-600 bg-green-100",
  },
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  NOT_STARTED: {
    label: "Not Started",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  ON_HOLD: {
    label: "On Hold",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-gray-500",
    bgColor: "bg-gray-100",
  },
};

export function WorkflowsClient({ initialWorkflows }: WorkflowsClientProps) {
  const router = useRouter();
  const [workflows, setWorkflows] = React.useState(initialWorkflows);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newWorkflow, setNewWorkflow] = React.useState({
    propertyTitle: "",
    region: "",
    district: "",
    town: "",
  });

  const filteredWorkflows = React.useMemo(() => {
    let filtered = workflows;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (w) =>
          w.propertyTitle?.toLowerCase().includes(query) ||
          w.region?.toLowerCase().includes(query) ||
          w.district?.toLowerCase().includes(query) ||
          w.listing?.title.toLowerCase().includes(query)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((w) => w.overallStatus === statusFilter);
    }

    return filtered;
  }, [workflows, searchQuery, statusFilter]);

  const handleCreateWorkflow = async () => {
    if (!newWorkflow.propertyTitle) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWorkflow),
      });

      if (response.ok) {
        const { workflow } = await response.json();
        router.push(`/workflows/${workflow.id}`);
      }
    } catch (error) {
      console.error("Failed to create workflow:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const stats = React.useMemo(() => {
    return {
      total: workflows.length,
      inProgress: workflows.filter((w) => w.overallStatus === "IN_PROGRESS").length,
      completed: workflows.filter((w) => w.overallStatus === "COMPLETED").length,
      alerts: workflows.reduce((sum, w) => sum + w._count.workflowAlerts, 0),
    };
  }, [workflows]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Workflows</h1>
          <p className="text-gray-500 mt-1">
            Track your land acquisition and building projects
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Workflow
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Projects</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Bell className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.alerts}</p>
              <p className="text-sm text-gray-500">Active Alerts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workflows..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {["IN_PROGRESS", "COMPLETED", "NOT_STARTED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? null : status)}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                statusFilter === status
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {statusConfig[status].label}
            </button>
          ))}
        </div>
      </div>

      {/* Workflows Grid */}
      {filteredWorkflows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || statusFilter ? "No workflows found" : "No workflows yet"}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || statusFilter
              ? "Try adjusting your search or filters"
              : "Start tracking your first property acquisition or building project"}
          </p>
          {!searchQuery && !statusFilter && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Workflow
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkflows.map((workflow) => {
            const module = moduleConfig[workflow.currentModule];
            const status = statusConfig[workflow.overallStatus];
            const ModuleIcon = module?.icon || MapPin;

            return (
              <Link
                key={workflow.id}
                href={`/workflows/${workflow.id}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-gray-300 transition-all group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", module?.color || "bg-gray-100")}>
                      <ModuleIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {workflow.propertyTitle || workflow.listing?.title || "Untitled Project"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {workflow.region || workflow.listing?.region}
                        {(workflow.district || workflow.listing?.district) &&
                          `, ${workflow.district || workflow.listing?.district}`}
                      </p>
                    </div>
                  </div>
                  {workflow._count.workflowAlerts > 0 && (
                    <span className="flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full">
                      {workflow._count.workflowAlerts}
                    </span>
                  )}
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">Overall Progress</span>
                    <span className="font-medium text-gray-900">
                      {workflow.overallProgress}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all"
                      style={{ width: `${workflow.overallProgress}%` }}
                    />
                  </div>
                </div>

                {/* Current Module */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Current Phase</p>
                    <p className="text-sm font-medium text-gray-900">
                      {module?.label || "Unknown"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      status?.bgColor,
                      status?.color
                    )}
                  >
                    {status?.label}
                  </span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {workflow._count.workflowDocuments}
                    </span>
                  </div>
                  <span className="text-sm text-green-600 font-medium group-hover:underline flex items-center">
                    View Details
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 m-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Create New Workflow
            </h2>
            <p className="text-gray-500 mb-6">
              Start tracking a new property acquisition or building project.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={newWorkflow.propertyTitle}
                  onChange={(e) =>
                    setNewWorkflow({ ...newWorkflow, propertyTitle: e.target.value })
                  }
                  placeholder="e.g., My East Legon Plot"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Region
                  </label>
                  <Input
                    value={newWorkflow.region}
                    onChange={(e) =>
                      setNewWorkflow({ ...newWorkflow, region: e.target.value })
                    }
                    placeholder="e.g., Greater Accra"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District
                  </label>
                  <Input
                    value={newWorkflow.district}
                    onChange={(e) =>
                      setNewWorkflow({ ...newWorkflow, district: e.target.value })
                    }
                    placeholder="e.g., Accra Metro"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Town/Area
                </label>
                <Input
                  value={newWorkflow.town}
                  onChange={(e) =>
                    setNewWorkflow({ ...newWorkflow, town: e.target.value })
                  }
                  placeholder="e.g., East Legon"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateWorkflow}
                disabled={!newWorkflow.propertyTitle || isCreating}
              >
                {isCreating ? "Creating..." : "Create Workflow"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
