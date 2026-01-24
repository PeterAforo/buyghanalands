import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { WorkflowDetailClient } from "./workflow-detail-client";

export const dynamic = "force-dynamic";

async function getWorkflow(id: string, userId: string) {
  const workflow = await prisma.propertyWorkflow.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          region: true,
          district: true,
          town: true,
          priceGhs: true,
          sizeAcres: true,
          media: {
            take: 1,
            select: { url: true },
          },
        },
      },
      landAcquisition: true,
      preConstruction: true,
      buildingPermit: {
        include: {
          districtAssembly: {
            select: {
              id: true,
              name: true,
              region: true,
              district: true,
              contactEmail: true,
              contactPhone: true,
            },
          },
        },
      },
      construction: {
        include: {
          inspections: true,
        },
      },
      workflowDocuments: {
        orderBy: { createdAt: "desc" },
      },
      workflowNotes: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      workflowAlerts: {
        where: { isDismissed: false },
        orderBy: { createdAt: "desc" },
      },
      costTracker: true,
    },
  });

  if (!workflow) return null;

  // Serialize BigInt and Decimal values
  return {
    ...workflow,
    listing: workflow.listing
      ? {
          ...workflow.listing,
          priceGhs: workflow.listing.priceGhs.toString(),
          sizeAcres: workflow.listing.sizeAcres.toString(),
          image: workflow.listing.media[0]?.url,
        }
      : null,
    landSizeAcres: workflow.landSizeAcres?.toString() || null,
    landAcquisition: workflow.landAcquisition
      ? {
          ...workflow.landAcquisition,
          initialOfferGhs: workflow.landAcquisition.initialOfferGhs?.toString() || null,
          agreedPriceGhs: workflow.landAcquisition.agreedPriceGhs?.toString() || null,
          totalPaidGhs: workflow.landAcquisition.totalPaidGhs?.toString() || null,
          stampDutyAmountGhs: workflow.landAcquisition.stampDutyAmountGhs?.toString() || null,
          vatAmountGhs: workflow.landAcquisition.vatAmountGhs?.toString() || null,
          registrationFeeGhs: workflow.landAcquisition.registrationFeeGhs?.toString() || null,
        }
      : null,
    preConstruction: workflow.preConstruction
      ? {
          ...workflow.preConstruction,
          buildingAreaSqm: workflow.preConstruction.buildingAreaSqm?.toString() || null,
          estimatedBudgetGhs: workflow.preConstruction.estimatedBudgetGhs?.toString() || null,
          professionalFeesEstimate: workflow.preConstruction.professionalFeesEstimate?.toString() || null,
          estimatedConstructionCostGhs: workflow.preConstruction.estimatedConstructionCostGhs?.toString() || null,
        }
      : null,
    buildingPermit: workflow.buildingPermit
      ? {
          ...workflow.buildingPermit,
          processingFeeGhs: workflow.buildingPermit.processingFeeGhs?.toString() || null,
          permitFeeGhs: workflow.buildingPermit.permitFeeGhs?.toString() || null,
        }
      : null,
    construction: workflow.construction
      ? {
          ...workflow.construction,
          contractValue: workflow.construction.contractValue?.toString() || null,
        }
      : null,
    costTracker: workflow.costTracker
      ? {
          ...workflow.costTracker,
          landPurchasePrice: workflow.costTracker.landPurchasePrice?.toString() || null,
          legalFees: workflow.costTracker.legalFees?.toString() || null,
          surveyorFees: workflow.costTracker.surveyorFees?.toString() || null,
          stampDuty: workflow.costTracker.stampDuty?.toString() || null,
          vat: workflow.costTracker.vat?.toString() || null,
          registrationFees: workflow.costTracker.registrationFees?.toString() || null,
          architectFees: workflow.costTracker.architectFees?.toString() || null,
          engineerFees: workflow.costTracker.engineerFees?.toString() || null,
          quantitySurveyorFees: workflow.costTracker.quantitySurveyorFees?.toString() || null,
          soilTestFees: workflow.costTracker.soilTestFees?.toString() || null,
          otherProfessionalFees: workflow.costTracker.otherProfessionalFees?.toString() || null,
          processingFees: workflow.costTracker.processingFees?.toString() || null,
          permitFees: workflow.costTracker.permitFees?.toString() || null,
          firePermitFees: workflow.costTracker.firePermitFees?.toString() || null,
          environmentalPermitFees: workflow.costTracker.environmentalPermitFees?.toString() || null,
          constructionBudget: workflow.costTracker.constructionBudget?.toString() || null,
          constructionActual: workflow.costTracker.constructionActual?.toString() || null,
          totalBudget: workflow.costTracker.totalBudget?.toString() || null,
          totalActual: workflow.costTracker.totalActual?.toString() || null,
        }
      : null,
  };
}

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/workflows");
  }

  const { id } = await params;
  const workflow = await getWorkflow(id, session.user.id);

  if (!workflow) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<WorkflowDetailLoading />}>
        <WorkflowDetailClient workflow={workflow} />
      </Suspense>
    </div>
  );
}

function WorkflowDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="h-48 bg-gray-200 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-gray-200 rounded-xl" />
          <div className="h-96 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
