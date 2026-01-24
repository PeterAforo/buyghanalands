import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateCostTrackerSchema = z.object({
  // Land Acquisition Costs
  landPurchasePrice: z.number().optional(),
  legalFees: z.number().optional(),
  surveyorFees: z.number().optional(),
  stampDuty: z.number().optional(),
  vat: z.number().optional(),
  registrationFees: z.number().optional(),

  // Pre-Construction Costs
  architectFees: z.number().optional(),
  engineerFees: z.number().optional(),
  quantitySurveyorFees: z.number().optional(),
  soilTestFees: z.number().optional(),
  otherProfessionalFees: z.number().optional(),

  // Permit Costs
  processingFees: z.number().optional(),
  permitFees: z.number().optional(),
  firePermitFees: z.number().optional(),
  environmentalPermitFees: z.number().optional(),

  // Construction Costs
  constructionBudget: z.number().optional(),
  constructionActual: z.number().optional(),

  // Totals
  totalBudget: z.number().optional(),
  totalActual: z.number().optional(),

  // Cost Items
  costItems: z.array(z.object({
    id: z.string().optional(),
    category: z.string(),
    description: z.string(),
    budgetAmount: z.number(),
    actualAmount: z.number(),
    paidDate: z.string().optional(),
    receiptUrl: z.string().optional(),
    notes: z.string().optional(),
  })).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const workflow = await prisma.propertyWorkflow.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        costTracker: true,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    // If no cost tracker exists, create one
    let costTracker = workflow.costTracker;
    if (!costTracker) {
      costTracker = await prisma.workflowCostTracker.create({
        data: {
          propertyWorkflowId: id,
        },
      });
    }

    // Calculate category totals
    const categories = [
      {
        name: "Land Acquisition",
        budgetTotal: Number(costTracker.landPurchasePrice || 0) +
          Number(costTracker.legalFees || 0) +
          Number(costTracker.surveyorFees || 0) +
          Number(costTracker.stampDuty || 0) +
          Number(costTracker.vat || 0) +
          Number(costTracker.registrationFees || 0),
        actualTotal: Number(costTracker.landPurchasePrice || 0) +
          Number(costTracker.legalFees || 0) +
          Number(costTracker.surveyorFees || 0) +
          Number(costTracker.stampDuty || 0) +
          Number(costTracker.vat || 0) +
          Number(costTracker.registrationFees || 0),
        items: [
          { id: "land", category: "Land Acquisition", description: "Land Purchase Price", budgetAmount: Number(costTracker.landPurchasePrice || 0), actualAmount: Number(costTracker.landPurchasePrice || 0) },
          { id: "legal", category: "Land Acquisition", description: "Legal Fees", budgetAmount: Number(costTracker.legalFees || 0), actualAmount: Number(costTracker.legalFees || 0) },
          { id: "surveyor", category: "Land Acquisition", description: "Surveyor Fees", budgetAmount: Number(costTracker.surveyorFees || 0), actualAmount: Number(costTracker.surveyorFees || 0) },
          { id: "stamp", category: "Land Acquisition", description: "Stamp Duty", budgetAmount: Number(costTracker.stampDuty || 0), actualAmount: Number(costTracker.stampDuty || 0) },
          { id: "vat", category: "Land Acquisition", description: "VAT", budgetAmount: Number(costTracker.vat || 0), actualAmount: Number(costTracker.vat || 0) },
          { id: "reg", category: "Land Acquisition", description: "Registration Fees", budgetAmount: Number(costTracker.registrationFees || 0), actualAmount: Number(costTracker.registrationFees || 0) },
        ].filter(item => item.budgetAmount > 0 || item.actualAmount > 0),
      },
      {
        name: "Professional Fees",
        budgetTotal: Number(costTracker.architectFees || 0) +
          Number(costTracker.engineerFees || 0) +
          Number(costTracker.quantitySurveyorFees || 0) +
          Number(costTracker.soilTestFees || 0) +
          Number(costTracker.otherProfessionalFees || 0),
        actualTotal: Number(costTracker.architectFees || 0) +
          Number(costTracker.engineerFees || 0) +
          Number(costTracker.quantitySurveyorFees || 0) +
          Number(costTracker.soilTestFees || 0) +
          Number(costTracker.otherProfessionalFees || 0),
        items: [
          { id: "arch", category: "Professional Fees", description: "Architect Fees", budgetAmount: Number(costTracker.architectFees || 0), actualAmount: Number(costTracker.architectFees || 0) },
          { id: "eng", category: "Professional Fees", description: "Engineer Fees", budgetAmount: Number(costTracker.engineerFees || 0), actualAmount: Number(costTracker.engineerFees || 0) },
          { id: "qs", category: "Professional Fees", description: "Quantity Surveyor Fees", budgetAmount: Number(costTracker.quantitySurveyorFees || 0), actualAmount: Number(costTracker.quantitySurveyorFees || 0) },
          { id: "soil", category: "Professional Fees", description: "Soil Test Fees", budgetAmount: Number(costTracker.soilTestFees || 0), actualAmount: Number(costTracker.soilTestFees || 0) },
          { id: "other", category: "Professional Fees", description: "Other Professional Fees", budgetAmount: Number(costTracker.otherProfessionalFees || 0), actualAmount: Number(costTracker.otherProfessionalFees || 0) },
        ].filter(item => item.budgetAmount > 0 || item.actualAmount > 0),
      },
      {
        name: "Permits & Approvals",
        budgetTotal: Number(costTracker.processingFees || 0) +
          Number(costTracker.permitFees || 0) +
          Number(costTracker.firePermitFees || 0) +
          Number(costTracker.environmentalPermitFees || 0),
        actualTotal: Number(costTracker.processingFees || 0) +
          Number(costTracker.permitFees || 0) +
          Number(costTracker.firePermitFees || 0) +
          Number(costTracker.environmentalPermitFees || 0),
        items: [
          { id: "proc", category: "Permits & Approvals", description: "Processing Fees", budgetAmount: Number(costTracker.processingFees || 0), actualAmount: Number(costTracker.processingFees || 0) },
          { id: "permit", category: "Permits & Approvals", description: "Permit Fees", budgetAmount: Number(costTracker.permitFees || 0), actualAmount: Number(costTracker.permitFees || 0) },
          { id: "fire", category: "Permits & Approvals", description: "Fire Permit Fees", budgetAmount: Number(costTracker.firePermitFees || 0), actualAmount: Number(costTracker.firePermitFees || 0) },
          { id: "env", category: "Permits & Approvals", description: "Environmental Permit Fees", budgetAmount: Number(costTracker.environmentalPermitFees || 0), actualAmount: Number(costTracker.environmentalPermitFees || 0) },
        ].filter(item => item.budgetAmount > 0 || item.actualAmount > 0),
      },
      {
        name: "Construction",
        budgetTotal: Number(costTracker.constructionBudget || 0),
        actualTotal: Number(costTracker.constructionActual || 0),
        items: [
          { id: "const", category: "Construction", description: "Construction Costs", budgetAmount: Number(costTracker.constructionBudget || 0), actualAmount: Number(costTracker.constructionActual || 0) },
        ].filter(item => item.budgetAmount > 0 || item.actualAmount > 0),
      },
    ].filter(cat => cat.items.length > 0);

    // Add custom cost items
    if (costTracker.costItems) {
      const customItems = costTracker.costItems as any[];
      customItems.forEach(item => {
        const existingCat = categories.find(c => c.name === item.category);
        if (existingCat) {
          existingCat.items.push(item);
          existingCat.budgetTotal += item.budgetAmount;
          existingCat.actualTotal += item.actualAmount;
        } else {
          categories.push({
            name: item.category,
            budgetTotal: item.budgetAmount,
            actualTotal: item.actualAmount,
            items: [item],
          });
        }
      });
    }

    return NextResponse.json({ costTracker, categories });
  } catch (error) {
    console.error("Error fetching cost tracker:", error);
    return NextResponse.json(
      { error: "Failed to fetch cost tracker" },
      { status: 500 }
    );
  }
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
    const validatedData = updateCostTrackerSchema.parse(body);

    // Verify ownership
    const workflow = await prisma.propertyWorkflow.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        costTracker: true,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    // Create or update cost tracker
    let costTracker;
    if (workflow.costTracker) {
      costTracker = await prisma.workflowCostTracker.update({
        where: { id: workflow.costTracker.id },
        data: validatedData,
      });
    } else {
      costTracker = await prisma.workflowCostTracker.create({
        data: {
          propertyWorkflowId: id,
          ...validatedData,
        },
      });
    }

    return NextResponse.json({ costTracker });
  } catch (error) {
    console.error("Error updating cost tracker:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update cost tracker" },
      { status: 500 }
    );
  }
}
