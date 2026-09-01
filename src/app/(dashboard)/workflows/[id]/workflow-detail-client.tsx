"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  MapPin,
  FileText,
  Bell,
  DollarSign,
  Users,
  Settings,
  ChevronRight,
  Check,
  Clock,
  Lock,
  AlertTriangle,
  Building2,
  Hammer,
  ClipboardCheck,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader, SectionCard } from "@/components/dashboard";
import {
  WorkflowProgressTracker,
  WorkflowChecklist,
  WorkflowAlerts,
  WorkflowAlertBanner,
  WorkflowDocumentVault,
  WorkflowCostTracker,
} from "@/components/workflow";
import type { WorkflowDocument, DocumentCategory, CostCategory } from "@/components/workflow";

interface WorkflowDetailClientProps {
  workflow: any;
}

const LAND_ACQUISITION_STAGES = [
  { id: 1, title: "Pre-Purchase Due Diligence", description: "Engage professionals and verify ownership", estimatedDuration: "2-4 weeks" },
  { id: 2, title: "Independent Verification", description: "Survey, site plan, and Lands Commission search", estimatedDuration: "1-2 weeks" },
  { id: 3, title: "Negotiation & Agreement", description: "Negotiate price and draft purchase agreement", estimatedDuration: "1-2 weeks" },
  { id: 4, title: "Payment & Documentation", description: "Make payment and gather all documents", estimatedDuration: "1 week" },
  { id: 5, title: "Land Registration", description: "Submit to Lands Commission for registration", estimatedDuration: "4-12 weeks" },
  { id: 6, title: "Secure Physical Possession", description: "Mark territory and establish monitoring", estimatedDuration: "Ongoing" },
];

const moduleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  LAND_ACQUISITION: { label: "Land Acquisition", icon: MapPin, color: "text-blue-600 bg-blue-100" },
  PRE_CONSTRUCTION: { label: "Pre-Construction", icon: ClipboardCheck, color: "text-purple-600 bg-purple-100" },
  BUILDING_PERMIT: { label: "Building Permit", icon: FileText, color: "text-amber-600 bg-amber-100" },
  CONSTRUCTION: { label: "Construction", icon: Hammer, color: "text-orange-600 bg-orange-100" },
  COMPLETION: { label: "Completion", icon: Home, color: "text-green-600 bg-green-100" },
};

export function WorkflowDetailClient({ workflow }: WorkflowDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState("overview");
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Document vault state
  const [documents, setDocuments] = React.useState<WorkflowDocument[]>([]);
  const [docCategories, setDocCategories] = React.useState<DocumentCategory[]>([]);
  const [isUploadingDocs, setIsUploadingDocs] = React.useState(false);

  // Cost tracker state
  const [costCategories, setCostCategories] = React.useState<CostCategory[]>([]);

  const workflowId = workflow.id;

  // Fetch documents when documents tab is opened
  const fetchDocuments = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/workflows/${workflowId}/documents`);
      if (!res.ok) return;
      const data = await res.json();
      setDocuments(data.documents || []);
      setDocCategories(data.categories || []);
    } catch (e) {
      // silent fail; UI shows empty state
    }
  }, [workflowId]);

  // Fetch cost tracker when costs tab is opened
  const fetchCosts = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/workflows/${workflowId}/costs`);
      if (!res.ok) return;
      const data = await res.json();
      setCostCategories(data.categories || []);
    } catch (e) {
      // silent fail; UI shows empty state
    }
  }, [workflowId]);

  React.useEffect(() => {
    if (activeTab === "documents" && documents.length === 0) {
      fetchDocuments();
    }
    if (activeTab === "costs" && costCategories.length === 0) {
      fetchCosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleUploadDocuments = React.useCallback(
    async (files: File[], category: string) => {
      if (files.length === 0) return;
      setIsUploadingDocs(true);
      try {
        for (const file of files) {
          // Convert file to base64 data URL for upload (simple vault upload)
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          await fetch(`/api/workflows/${workflowId}/documents`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category,
              documentType: file.type || "document",
              title: file.name.replace(/\.[^.]+$/, ""),
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type || "application/octet-stream",
              fileUrl: dataUrl,
            }),
          });
        }
        await fetchDocuments();
      } finally {
        setIsUploadingDocs(false);
      }
    },
    [workflowId, fetchDocuments]
  );

  const handleDeleteDocument = React.useCallback(
    async (documentId: string) => {
      await fetch(
        `/api/workflows/${workflowId}/documents?documentId=${encodeURIComponent(documentId)}`,
        { method: "DELETE" }
      );
      await fetchDocuments();
    },
    [workflowId, fetchDocuments]
  );

  const handleAddCostItem = React.useCallback(
    async (category: string, item: { description: string; budgetAmount: number; actualAmount: number; notes?: string }) => {
      const newCostItems = [
        ...(costCategories.flatMap((c) => c.items) as any[]),
        {
          category,
          description: item.description,
          budgetAmount: item.budgetAmount,
          actualAmount: item.actualAmount,
          notes: item.notes,
        },
      ];
      await fetch(`/api/workflows/${workflowId}/costs`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ costItems: newCostItems }),
      });
      await fetchCosts();
    },
    [workflowId, costCategories, fetchCosts]
  );

  const handleDeleteCostItem = React.useCallback(
    async (itemId: string) => {
      const remaining = costCategories
        .flatMap((c) => c.items)
        .filter((item: any) => item.id !== itemId)
        .map(({ id, ...rest }: any) => rest);
      await fetch(`/api/workflows/${workflowId}/costs`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ costItems: remaining }),
      });
      await fetchCosts();
    },
    [workflowId, costCategories, fetchCosts]
  );

  const module = moduleConfig[workflow.currentModule];
  const ModuleIcon = module?.icon || MapPin;

  // Build stages for progress tracker
  const stages = React.useMemo(() => {
    if (!workflow.landAcquisition) return [];

    return LAND_ACQUISITION_STAGES.map((stage) => {
      const statusKey = `stage${stage.id}Status` as keyof typeof workflow.landAcquisition;
      const progressKey = `stage${stage.id}Progress` as keyof typeof workflow.landAcquisition;

      return {
        ...stage,
        status: workflow.landAcquisition[statusKey] || "LOCKED",
        progress: workflow.landAcquisition[progressKey] || 0,
      };
    });
  }, [workflow.landAcquisition]);

  // Build checklist tasks for current stage
  const currentStageTasks = React.useMemo(() => {
    if (!workflow.landAcquisition) return [];

    const la = workflow.landAcquisition;
    const currentStage = la.currentStage || 1;

    const tasksByStage: Record<number, any[]> = {
      1: [
        {
          id: "lawyer",
          title: "Engage Real Estate Lawyer",
          description: "Hire a qualified lawyer to guide you through the process",
          status: la.lawyerEngaged ? "COMPLETED" : "PENDING",
          priority: "CRITICAL",
          isMandatory: true,
          warningMessage: !la.lawyerEngaged ? "It is strongly recommended to engage a lawyer before proceeding" : undefined,
          actionType: "professional",
          actionLabel: "Find Lawyer",
        },
        {
          id: "surveyor",
          title: "Hire Licensed Surveyor",
          description: "Commission an independent survey of the property",
          status: la.surveyorEngaged ? "COMPLETED" : "PENDING",
          priority: "HIGH",
          isMandatory: true,
          actionType: "professional",
          actionLabel: "Find Surveyor",
        },
        {
          id: "ownership",
          title: "Verify Land Ownership",
          description: "Confirm the seller is the legitimate owner",
          status: la.ownershipVerified ? "COMPLETED" : la.ownershipVerificationStatus === "PENDING" ? "PENDING" : "IN_PROGRESS",
          priority: "CRITICAL",
          isMandatory: true,
          helpText: "Request ownership documents from the seller and verify with Lands Commission",
        },
        {
          id: "landType",
          title: "Check Land Type",
          description: "Determine if the land is Government, Vested, Customary/Stool, or Family/Private",
          status: la.landOwnershipType ? "COMPLETED" : "PENDING",
          priority: "HIGH",
          isMandatory: true,
          helpText: la.isForeignBuyer ? "As a foreign buyer, you can only acquire leasehold interest (50-year renewable terms)" : undefined,
        },
      ],
      2: [
        {
          id: "survey",
          title: "Commission Independent Land Survey",
          description: "Get an independent survey to verify boundaries",
          status: la.surveyReportReceived ? "COMPLETED" : la.independentSurveyCommissioned ? "IN_PROGRESS" : "PENDING",
          priority: "HIGH",
          isMandatory: true,
          helpText: "Budget: GHS 2,000-8,000 depending on location and size",
        },
        {
          id: "sitePlan",
          title: "Obtain Verified Site Plan",
          description: "Get a site plan signed by a licensed surveyor",
          status: la.verifiedSitePlanObtained ? "COMPLETED" : "PENDING",
          priority: "CRITICAL",
          isMandatory: true,
          warningMessage: !la.verifiedSitePlanObtained ? "Never pay for land without a verified site plan" : undefined,
          subTasks: [
            { id: "sp1", title: "Shows true owners and locations", completed: la.verifiedSitePlanObtained },
            { id: "sp2", title: "Signed by licensed surveyor", completed: la.verifiedSitePlanObtained },
            { id: "sp3", title: "Regional surveyor certification", completed: la.verifiedSitePlanObtained },
            { id: "sp4", title: "Boundary coordinates included", completed: la.verifiedSitePlanObtained },
          ],
        },
        {
          id: "landsSearch",
          title: "Conduct Lands Commission Search",
          description: "Official search to verify ownership and encumbrances",
          status: la.landsCommissionSearchDone ? "COMPLETED" : "PENDING",
          priority: "CRITICAL",
          isMandatory: true,
        },
        {
          id: "neighbors",
          title: "Neighbor Consultation",
          description: "Interview neighbors about the land history",
          status: la.neighborConsultationDone ? "COMPLETED" : "PENDING",
          priority: "MEDIUM",
          isMandatory: false,
          helpText: "Ask about any disputes, claims, or issues with the land",
        },
      ],
      3: [
        {
          id: "negotiate",
          title: "Direct Negotiation with Owner",
          description: "Negotiate price and terms directly with the owner",
          status: la.negotiationStatus === "AGREED" ? "COMPLETED" : la.negotiationStatus === "IN_PROGRESS" ? "IN_PROGRESS" : "PENDING",
          priority: "HIGH",
          isMandatory: true,
          warningMessage: "Always negotiate directly with the actual owner - avoid middlemen",
        },
        {
          id: "agreement",
          title: "Draft Purchase Agreement",
          description: "Have your lawyer prepare the purchase agreement",
          status: la.purchaseAgreementDrafted ? "COMPLETED" : "PENDING",
          priority: "CRITICAL",
          isMandatory: true,
          subTasks: [
            { id: "ag1", title: "Three copies prepared", completed: la.agreementCopiesCount >= 3 },
            { id: "ag2", title: "Lawyer's practice stamp on each", completed: la.purchaseAgreementDrafted },
            { id: "ag3", title: "Site plan attached (2 additional copies)", completed: la.purchaseAgreementDrafted },
            { id: "ag4", title: "All terms included: price, payment schedule, lease duration", completed: la.purchaseAgreementDrafted },
          ],
        },
        {
          id: "witnesses",
          title: "Arrange Witnesses",
          description: "At least 2 witnesses required (1 from each side)",
          status: la.witnessesArranged ? "COMPLETED" : "PENDING",
          priority: "HIGH",
          isMandatory: true,
        },
        {
          id: "sign",
          title: "Sign & Endorse Documents",
          description: "Both parties sign agreement and endorse site plan",
          status: la.documentsSignedEndorsed ? "COMPLETED" : "PENDING",
          priority: "CRITICAL",
          isMandatory: true,
        },
      ],
      4: [
        {
          id: "payment",
          title: "Make Payment",
          description: "Transfer payment to the seller",
          status: la.totalPaidGhs && Number(la.totalPaidGhs) > 0 ? "COMPLETED" : "PENDING",
          priority: "CRITICAL",
          isMandatory: true,
          warningMessage: "Use bank transfers for safety - avoid large cash transactions",
          helpText: la.agreedPriceGhs ? `Agreed price: GHS ${Number(la.agreedPriceGhs).toLocaleString()}` : undefined,
        },
        {
          id: "stampDuty",
          title: "Pay Stamp Duty",
          description: "0.25% - 1% of property value (progressive rates)",
          status: la.stampDutyPaid ? "COMPLETED" : "PENDING",
          priority: "HIGH",
          isMandatory: true,
        },
        {
          id: "vat",
          title: "Pay VAT (if applicable)",
          description: "5% + 1% COVID levy for new developments",
          status: la.vatPaid ? "COMPLETED" : "PENDING",
          priority: "MEDIUM",
          isMandatory: false,
        },
        {
          id: "regFee",
          title: "Pay Registration Fee",
          description: "GHS 100-2,000 depending on property value",
          status: la.registrationFeePaid ? "COMPLETED" : "PENDING",
          priority: "HIGH",
          isMandatory: true,
        },
        {
          id: "docs",
          title: "Gather Final Documents",
          description: "Collect all required documents for registration",
          status: la.allDocumentsGathered ? "COMPLETED" : "PENDING",
          priority: "HIGH",
          isMandatory: true,
          requiredDocuments: [
            "Purchase agreement (all 3 signed copies)",
            "Site plan (endorsed by both parties)",
            "Payment receipts (all)",
            "Buyer's proof of identity",
            "Tax payment receipts",
            "Witness information",
          ],
        },
      ],
      5: [
        {
          id: "submit",
          title: "Submit to Lands Commission",
          description: "Submit all documents for registration",
          status: la.submittedToLandsCommission ? "COMPLETED" : "PENDING",
          priority: "CRITICAL",
          isMandatory: true,
          helpText: la.landsCommissionRefNumber ? `Reference: ${la.landsCommissionRefNumber}` : undefined,
        },
        {
          id: "valuation",
          title: "Ghana Land Valuation Board Review",
          description: "Property valuation and stamping",
          status: la.valuationBoardStatus === "Certified" ? "COMPLETED" : la.valuationBoardStatus ? "IN_PROGRESS" : "PENDING",
          priority: "HIGH",
          isMandatory: true,
        },
        {
          id: "irs",
          title: "IRS Tax Clearance",
          description: "Obtain tax clearance certificate",
          status: la.irsTaxClearanceStatus === "Certificate Issued" ? "COMPLETED" : la.irsTaxClearanceStatus ? "IN_PROGRESS" : "PENDING",
          priority: "HIGH",
          isMandatory: true,
        },
        {
          id: "deeds",
          title: "Deeds Registry Final Registration",
          description: "Final registration with Deeds Registry",
          status: la.deedsRegistryStatus === "Registered" ? "COMPLETED" : la.deedsRegistryStatus ? "IN_PROGRESS" : "PENDING",
          priority: "HIGH",
          isMandatory: true,
        },
        {
          id: "title",
          title: "Receive Land Title Certificate",
          description: "Collect your official land title",
          status: la.landTitleReceived ? "COMPLETED" : "PENDING",
          priority: "CRITICAL",
          isMandatory: true,
          helpText: la.landTitleNumber ? `Title Number: ${la.landTitleNumber}` : "Timeline: 4-12 weeks from submission",
        },
      ],
      6: [
        {
          id: "mark",
          title: "Mark Territory",
          description: "Physically mark your land boundaries",
          status: la.territoryMarked ? "COMPLETED" : "PENDING",
          priority: "HIGH",
          isMandatory: true,
          subTasks: [
            { id: "mk1", title: "Fence erected", completed: false },
            { id: "mk2", title: "Wall built", completed: false },
            { id: "mk3", title: "Sand dumped", completed: false },
            { id: "mk4", title: "Sign posted", completed: false },
          ],
        },
        {
          id: "monitor",
          title: "Continuous Monitoring",
          description: "Regular site visits to prevent encroachment",
          status: la.possessionStatus === "SECURED" ? "COMPLETED" : la.possessionStatus === "MONITORING" ? "IN_PROGRESS" : "PENDING",
          priority: "HIGH",
          isMandatory: true,
          helpText: la.nextScheduledVisit ? `Next visit: ${new Date(la.nextScheduledVisit).toLocaleDateString()}` : "Set up a monitoring schedule",
        },
      ],
    };

    return tasksByStage[currentStage] || [];
  }, [workflow.landAcquisition]);

  // Format alerts for the component
  const alerts = React.useMemo(() => {
    return workflow.workflowAlerts.map((alert: any) => ({
      ...alert,
      type: alert.alertType,
      createdAt: new Date(alert.createdAt),
      dueDate: alert.dueDate ? new Date(alert.dueDate) : undefined,
      triggerDate: alert.triggerDate ? new Date(alert.triggerDate) : undefined,
    }));
  }, [workflow.workflowAlerts]);

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    // Task toggle would update the specific task in the workflow
  };

  const handleTaskAction = async (taskId: string, actionType: string) => {
    if (actionType === "professional") {
      router.push("/professionals");
    }
  };

  const handleAlertDismiss = async (alertId: string) => {
    try {
      await fetch(`/api/workflows/${workflow.id}/alerts?alertId=${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDismissed: true }),
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to dismiss alert:", error);
    }
  };

  const handleAlertMarkRead = async (alertId: string) => {
    try {
      await fetch(`/api/workflows/${workflow.id}/alerts?alertId=${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to mark alert as read:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={workflow.propertyTitle || workflow.listing?.title || "Untitled Project"}
        description={`${workflow.region || workflow.listing?.region}${
          (workflow.district || workflow.listing?.district) &&
          `, ${workflow.district || workflow.listing?.district}`
        }${
          (workflow.town || workflow.listing?.town) &&
          ` • ${workflow.town || workflow.listing?.town}`
        }`}
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Workflows", href: "/workflows" },
          { label: workflow.propertyTitle || workflow.listing?.title || "Untitled Project" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className={cn("p-3 rounded-xl", module?.color || "bg-gray-100")}>
              <ModuleIcon className="h-6 w-6" />
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </div>
        }
      />

      {/* Critical Alerts Banner */}
      {alerts.filter((a: any) => a.type === "warning" || a.type === "deadline").length > 0 && (
        <div className="space-y-3">
          {alerts
            .filter((a: any) => (a.type === "warning" || a.type === "deadline") && !a.isRead)
            .slice(0, 2)
            .map((alert: any) => (
              <WorkflowAlertBanner
                key={alert.id}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onDismiss={() => handleAlertDismiss(alert.id)}
              />
            ))}
        </div>
      )}

      {/* Progress Tracker */}
      <div>
        <WorkflowProgressTracker
          title="Land Acquisition Progress"
          currentStage={workflow.landAcquisition?.currentStage || 1}
          stages={stages}
          overallProgress={workflow.landAcquisition?.progress || 0}
          variant="horizontal"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="documents">
            Documents
            {workflow.workflowDocuments.length > 0 && (
              <span className="ml-1 text-xs bg-gray-200 px-1.5 py-0.5 rounded-full">
                {workflow.workflowDocuments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            {alerts.filter((a: any) => !a.isRead).length > 0 && (
              <span className="ml-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                {alerts.filter((a: any) => !a.isRead).length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Stage Tasks */}
              <WorkflowChecklist
                title={`Stage ${workflow.landAcquisition?.currentStage || 1}: ${LAND_ACQUISITION_STAGES[(workflow.landAcquisition?.currentStage || 1) - 1]?.title}`}
                description={LAND_ACQUISITION_STAGES[(workflow.landAcquisition?.currentStage || 1) - 1]?.description}
                tasks={currentStageTasks}
                onTaskToggle={handleTaskToggle}
                onTaskAction={handleTaskAction}
                showProgress
              />

              {/* Vertical Progress */}
              <WorkflowProgressTracker
                title="All Stages"
                currentStage={workflow.landAcquisition?.currentStage || 1}
                stages={stages}
                overallProgress={workflow.landAcquisition?.progress || 0}
                variant="vertical"
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Alerts */}
              <WorkflowAlerts
                alerts={alerts}
                onMarkAsRead={handleAlertMarkRead}
                onDismiss={handleAlertDismiss}
                maxVisible={5}
              />

              {/* Quick Stats */}
              <SectionCard title="Quick Stats">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Documents</span>
                    <span className="font-medium">{workflow.workflowDocuments.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Current Stage</span>
                    <span className="font-medium">{workflow.landAcquisition?.currentStage || 1} of 6</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Started</span>
                    <span className="font-medium">
                      {workflow.startedAt
                        ? new Date(workflow.startedAt).toLocaleDateString()
                        : "Not started"}
                    </span>
                  </div>
                </div>
              </SectionCard>

              {/* Linked Listing */}
              {workflow.listing && (
                <SectionCard title="Linked Listing">
                  <Link
                    href={`/listings/${workflow.listing.id}`}
                    className="block hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors"
                  >
                    {workflow.listing.image && (
                      <Image
                        src={workflow.listing.image}
                        alt={workflow.listing.title}
                        width={600}
                        height={128}
                        unoptimized
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}
                    <p className="font-medium text-gray-900">{workflow.listing.title}</p>
                    <p className="text-sm text-gray-500">
                      {workflow.listing.region}, {workflow.listing.district}
                    </p>
                    <p className="text-lg font-bold text-green-600 mt-2">
                      GHS {Number(workflow.listing.priceGhs).toLocaleString()}
                    </p>
                  </Link>
                </SectionCard>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <div className="space-y-6">
            {LAND_ACQUISITION_STAGES.map((stage) => {
              const stageStatus = workflow.landAcquisition?.[`stage${stage.id}Status`] || "LOCKED";
              const stageProgress = workflow.landAcquisition?.[`stage${stage.id}Progress`] || 0;

              return (
                <WorkflowChecklist
                  key={stage.id}
                  title={`Stage ${stage.id}: ${stage.title}`}
                  description={stage.description}
                  tasks={stageStatus === "LOCKED" ? [] : currentStageTasks}
                  onTaskToggle={handleTaskToggle}
                  onTaskAction={handleTaskAction}
                  showProgress
                  collapsible
                  defaultExpanded={stage.id === workflow.landAcquisition?.currentStage}
                />
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <WorkflowDocumentVault
            documents={documents}
            categories={docCategories}
            onUpload={handleUploadDocuments}
            onDelete={handleDeleteDocument}
            onDownload={(docId) => {
              const doc = documents.find((d) => d.id === docId);
              if (doc) window.open(doc.fileUrl, "_blank");
            }}
            isUploading={isUploadingDocs}
          />
        </TabsContent>

        <TabsContent value="costs" className="mt-6">
          <WorkflowCostTracker
            categories={costCategories}
            onAddItem={handleAddCostItem}
            onDeleteItem={handleDeleteCostItem}
          />
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <WorkflowAlerts
            alerts={alerts}
            onMarkAsRead={handleAlertMarkRead}
            onDismiss={handleAlertDismiss}
            showDismissed={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
