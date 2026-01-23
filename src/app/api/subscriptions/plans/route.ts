/**
 * Subscription Plans API
 * 
 * GET /api/subscriptions/plans - Get all available subscription plans
 * GET /api/subscriptions/plans?category=SELLER - Get plans for a specific category
 */

import { NextRequest, NextResponse } from "next/server";
import {
  BUYER_PLANS,
  SELLER_PLANS,
  AGENT_PLANS,
  PROFESSIONAL_PLANS,
  getPlansForCategory,
} from "@/lib/subscriptions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category")?.toUpperCase();

    if (category) {
      // Return plans for specific category
      if (!["BUYER", "SELLER", "AGENT", "PROFESSIONAL"].includes(category)) {
        return NextResponse.json(
          { error: "Invalid category. Must be BUYER, SELLER, AGENT, or PROFESSIONAL" },
          { status: 400 }
        );
      }

      const plans = getPlansForCategory(category as any);
      return NextResponse.json({
        category,
        plans,
      });
    }

    // Return all plans grouped by category
    return NextResponse.json({
      buyer: Object.values(BUYER_PLANS),
      seller: Object.values(SELLER_PLANS),
      agent: Object.values(AGENT_PLANS),
      professional: Object.values(PROFESSIONAL_PLANS),
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription plans" },
      { status: 500 }
    );
  }
}
