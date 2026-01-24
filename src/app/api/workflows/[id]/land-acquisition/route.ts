import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateLandAcquisitionSchema = z.object({
  // Stage 1: Pre-Purchase Due Diligence
  lawyerEngaged: z.boolean().optional(),
  lawyerProfessionalId: z.string().optional(),
  surveyorEngaged: z.boolean().optional(),
  surveyorProfessionalId: z.string().optional(),
  propertyInspections: z.array(z.object({
    date: z.string(),
    notes: z.string(),
    photos: z.array(z.string()).optional(),
  })).optional(),
  ownershipVerified: z.boolean().optional(),
  ownershipVerificationStatus: z.enum(["PENDING", "CONFIRMED", "ISSUES_FOUND", "DISPUTED"]).optional(),
  landOwnershipType: z.enum(["GOVERNMENT", "VESTED", "CUSTOMARY_STOOL", "FAMILY_PRIVATE"]).optional(),
  isForeignBuyer: z.boolean().optional(),

  // Stage 2: Independent Verification
  independentSurveyCommissioned: z.boolean().optional(),
  independentSurveyStatus: z.string().optional(),
  surveyReportReceived: z.boolean().optional(),
  verifiedSitePlanObtained: z.boolean().optional(),
  landsCommissionSearchDone: z.boolean().optional(),
  searchFindings: z.object({
    ownershipConfirmed: z.boolean().optional(),
    disputesFound: z.boolean().optional(),
    encumbrances: z.boolean().optional(),
    registrationStatus: z.string().optional(),
  }).optional(),
  neighborConsultationDone: z.boolean().optional(),
  neighborConsultationLog: z.array(z.object({
    date: z.string(),
    name: z.string(),
    findings: z.string(),
  })).optional(),

  // Stage 3: Negotiation & Agreement
  negotiationStatus: z.enum(["NOT_STARTED", "IN_PROGRESS", "AGREED", "FAILED"]).optional(),
  initialOfferGhs: z.number().optional(),
  agreedPriceGhs: z.number().optional(),
  paymentTerms: z.string().optional(),
  purchaseAgreementDrafted: z.boolean().optional(),
  agreementCopiesCount: z.number().optional(),
  witnessesArranged: z.boolean().optional(),
  witnesses: z.array(z.object({
    side: z.enum(["buyer", "seller"]),
    fullName: z.string(),
    address: z.string(),
    idNumber: z.string().optional(),
  })).optional(),
  documentsSignedEndorsed: z.boolean().optional(),

  // Stage 4: Payment & Documentation
  paymentMethod: z.string().optional(),
  totalPaidGhs: z.number().optional(),
  payments: z.array(z.object({
    amount: z.number(),
    date: z.string(),
    reference: z.string(),
    method: z.string(),
    receiptUrl: z.string().optional(),
  })).optional(),
  stampDutyPaid: z.boolean().optional(),
  stampDutyAmountGhs: z.number().optional(),
  vatPaid: z.boolean().optional(),
  vatAmountGhs: z.number().optional(),
  registrationFeePaid: z.boolean().optional(),
  registrationFeeGhs: z.number().optional(),
  allDocumentsGathered: z.boolean().optional(),

  // Stage 5: Land Registration
  submittedToLandsCommission: z.boolean().optional(),
  landsCommissionSubmissionDate: z.string().optional(),
  landsCommissionRefNumber: z.string().optional(),
  registrationStatus: z.string().optional(),
  valuationBoardStatus: z.string().optional(),
  irsTaxClearanceStatus: z.string().optional(),
  deedsRegistryStatus: z.string().optional(),
  landTitleReceived: z.boolean().optional(),
  landTitleNumber: z.string().optional(),
  cadastralPlanReceived: z.boolean().optional(),

  // Stage 6: Secure Physical Possession
  possessionStatus: z.enum(["NOT_TAKEN", "MARKING_TERRITORY", "MONITORING", "SECURED", "DISPUTED"]).optional(),
  territoryMarked: z.boolean().optional(),
  markingActions: z.array(z.object({
    type: z.enum(["fence", "wall", "sand", "sign"]),
    date: z.string(),
    photos: z.array(z.string()).optional(),
  })).optional(),
  monitoringSchedule: z.string().optional(),
  securityHired: z.boolean().optional(),
  securityCompanyDetails: z.string().optional(),
  lastSiteVisit: z.string().optional(),
  nextScheduledVisit: z.string().optional(),
  incidents: z.array(z.object({
    date: z.string(),
    description: z.string(),
    photos: z.array(z.string()).optional(),
    actionTaken: z.string().optional(),
  })).optional(),
});

function calculateStageProgress(data: any, stage: number): number {
  const stageChecks: Record<number, string[]> = {
    1: ["lawyerEngaged", "surveyorEngaged", "ownershipVerified", "landOwnershipType"],
    2: ["independentSurveyCommissioned", "surveyReportReceived", "verifiedSitePlanObtained", "landsCommissionSearchDone", "neighborConsultationDone"],
    3: ["purchaseAgreementDrafted", "witnessesArranged", "documentsSignedEndorsed"],
    4: ["totalPaidGhs", "stampDutyPaid", "allDocumentsGathered"],
    5: ["submittedToLandsCommission", "landTitleReceived", "cadastralPlanReceived"],
    6: ["territoryMarked", "possessionStatus"],
  };

  const checks = stageChecks[stage] || [];
  if (checks.length === 0) return 0;

  let completed = 0;
  for (const check of checks) {
    const value = data[check];
    if (value !== null && value !== undefined && value !== false && value !== "" && value !== "NOT_STARTED" && value !== "NOT_TAKEN" && value !== "PENDING") {
      completed++;
    }
  }

  return Math.round((completed / checks.length) * 100);
}

function determineCurrentStage(data: any): number {
  // Check stages in reverse order to find the highest active stage
  for (let stage = 6; stage >= 1; stage--) {
    const progress = calculateStageProgress(data, stage);
    if (progress > 0) {
      return stage;
    }
  }
  return 1;
}

function calculateOverallProgress(data: any): number {
  let totalProgress = 0;
  for (let stage = 1; stage <= 6; stage++) {
    totalProgress += calculateStageProgress(data, stage);
  }
  return Math.round(totalProgress / 6);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateLandAcquisitionSchema.parse(body);

    // Verify ownership
    const workflow = await prisma.propertyWorkflow.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        landAcquisition: true,
      },
    });

    if (!workflow || !workflow.landAcquisition) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = { ...validatedData };

    // Convert date strings to Date objects
    if (validatedData.landsCommissionSubmissionDate) {
      updateData.landsCommissionSubmissionDate = new Date(validatedData.landsCommissionSubmissionDate);
    }
    if (validatedData.lastSiteVisit) {
      updateData.lastSiteVisit = new Date(validatedData.lastSiteVisit);
    }
    if (validatedData.nextScheduledVisit) {
      updateData.nextScheduledVisit = new Date(validatedData.nextScheduledVisit);
    }

    // Update land acquisition
    const updatedLandAcquisition = await prisma.landAcquisitionWorkflow.update({
      where: { id: workflow.landAcquisition.id },
      data: updateData,
    });

    // Calculate progress for each stage
    const mergedData = { ...workflow.landAcquisition, ...updatedLandAcquisition };
    const stage1Progress = calculateStageProgress(mergedData, 1);
    const stage2Progress = calculateStageProgress(mergedData, 2);
    const stage3Progress = calculateStageProgress(mergedData, 3);
    const stage4Progress = calculateStageProgress(mergedData, 4);
    const stage5Progress = calculateStageProgress(mergedData, 5);
    const stage6Progress = calculateStageProgress(mergedData, 6);
    const overallProgress = calculateOverallProgress(mergedData);
    const currentStage = determineCurrentStage(mergedData);

    // Determine stage statuses
    const getStageStatus = (progress: number, stageNum: number) => {
      if (progress === 100) return "COMPLETED";
      if (progress > 0) return "IN_PROGRESS";
      if (stageNum === 1) return "NOT_STARTED";
      // Check if previous stage is complete
      const prevProgress = calculateStageProgress(mergedData, stageNum - 1);
      return prevProgress >= 80 ? "NOT_STARTED" : "LOCKED";
    };

    // Update with calculated progress
    const finalUpdate = await prisma.landAcquisitionWorkflow.update({
      where: { id: workflow.landAcquisition.id },
      data: {
        currentStage,
        progress: overallProgress,
        stage1Progress,
        stage2Progress,
        stage3Progress,
        stage4Progress,
        stage5Progress,
        stage6Progress,
        stage1Status: getStageStatus(stage1Progress, 1) as any,
        stage2Status: getStageStatus(stage2Progress, 2) as any,
        stage3Status: getStageStatus(stage3Progress, 3) as any,
        stage4Status: getStageStatus(stage4Progress, 4) as any,
        stage5Status: getStageStatus(stage5Progress, 5) as any,
        stage6Status: getStageStatus(stage6Progress, 6) as any,
        status: overallProgress === 100 ? "COMPLETED" : overallProgress > 0 ? "IN_PROGRESS" : "NOT_STARTED",
        ...(overallProgress > 0 && !workflow.landAcquisition.startedAt && { startedAt: new Date() }),
        ...(overallProgress === 100 && { completedAt: new Date() }),
      },
    });

    // Update parent workflow progress
    await prisma.propertyWorkflow.update({
      where: { id },
      data: {
        overallProgress: Math.round(overallProgress * 0.25), // Land acquisition is 25% of total
        overallStatus: overallProgress > 0 ? "IN_PROGRESS" : "NOT_STARTED",
        ...(overallProgress > 0 && !workflow.startedAt && { startedAt: new Date() }),
      },
    });

    // Create alerts based on progress
    if (validatedData.lawyerEngaged === false && stage1Progress > 20) {
      await prisma.workflowAlert.create({
        data: {
          propertyWorkflowId: id,
          alertType: "warning",
          title: "Lawyer Not Yet Engaged",
          message: "You should engage a lawyer before proceeding further with the land acquisition process.",
          module: "LAND_ACQUISITION",
          stage: 1,
          isRead: false,
          isDismissed: false,
        },
      });
    }

    if (validatedData.verifiedSitePlanObtained === false && validatedData.totalPaidGhs && Number(validatedData.totalPaidGhs) > 0) {
      await prisma.workflowAlert.create({
        data: {
          propertyWorkflowId: id,
          alertType: "deadline",
          title: "Site Plan Not Verified Before Payment",
          message: "WARNING: You have made payment without obtaining a verified site plan. This is a significant risk.",
          module: "LAND_ACQUISITION",
          stage: 2,
          isRead: false,
          isDismissed: false,
        },
      });
    }

    return NextResponse.json({ landAcquisition: finalUpdate });
  } catch (error) {
    console.error("Error updating land acquisition:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update land acquisition" },
      { status: 500 }
    );
  }
}
