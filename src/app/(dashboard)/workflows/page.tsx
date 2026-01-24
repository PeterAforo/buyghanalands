import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { WorkflowsClient } from "./workflows-client";

export const dynamic = "force-dynamic";

async function getWorkflows(userId: string) {
  const workflows = await prisma.propertyWorkflow.findMany({
    where: { userId },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          region: true,
          district: true,
          priceGhs: true,
          media: {
            take: 1,
            select: { url: true },
          },
        },
      },
      landAcquisition: {
        select: {
          currentStage: true,
          status: true,
          progress: true,
        },
      },
      preConstruction: {
        select: {
          currentStage: true,
          status: true,
          progress: true,
        },
      },
      buildingPermit: {
        select: {
          currentStage: true,
          status: true,
          progress: true,
        },
      },
      construction: {
        select: {
          currentStage: true,
          status: true,
          progress: true,
        },
      },
      _count: {
        select: {
          workflowDocuments: true,
          workflowAlerts: {
            where: { isRead: false, isDismissed: false },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return workflows.map((w) => ({
    ...w,
    listing: w.listing
      ? {
          ...w.listing,
          priceGhs: w.listing.priceGhs.toString(),
          image: w.listing.media[0]?.url,
        }
      : null,
    landSizeAcres: w.landSizeAcres?.toString() || null,
  }));
}

export default async function WorkflowsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/workflows");
  }

  const workflows = await getWorkflows(session.user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<WorkflowsLoading />}>
        <WorkflowsClient initialWorkflows={workflows} />
      </Suspense>
    </div>
  );
}

function WorkflowsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
