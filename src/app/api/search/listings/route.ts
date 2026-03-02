import { NextRequest, NextResponse } from "next/server";
import { searchListings, ListingSearchOptions, checkMeilisearchHealth } from "@/lib/meilisearch";
import { z } from "zod";

const searchSchema = z.object({
  query: z.string().optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  constituency: z.string().optional(),
  landType: z.string().optional(),
  categoryName: z.string().optional(),
  tenureType: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minSize: z.coerce.number().optional(),
  maxSize: z.coerce.number().optional(),
  isVerified: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(['price_asc', 'price_desc', 'date_desc', 'date_asc', 'size_asc', 'size_desc']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Check if Meilisearch is available
    const isHealthy = await checkMeilisearchHealth();
    if (!isHealthy) {
      return NextResponse.json(
        { error: "Search service temporarily unavailable" },
        { status: 503 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    const validated = searchSchema.safeParse(params);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid search parameters", details: validated.error.issues },
        { status: 400 }
      );
    }

    const { query, page, limit, sort, ...filters } = validated.data;

    const searchOptions: ListingSearchOptions = {
      query,
      page,
      limit,
      sort,
      filters: {
        ...filters,
        status: "PUBLISHED", // Only search published listings
      },
    };

    const result = await searchListings(searchOptions);

    return NextResponse.json({
      listings: result.hits,
      pagination: {
        page: result.page,
        limit,
        totalHits: result.totalHits,
        totalPages: result.totalPages,
      },
      processingTimeMs: result.processingTimeMs,
    });
  } catch (error: any) {
    // Handle index not found error gracefully
    if (error?.code === 'index_not_found' || error?.message?.includes('not found')) {
      return NextResponse.json({
        listings: [],
        pagination: { page: 1, limit: 20, totalHits: 0, totalPages: 0 },
        processingTimeMs: 0,
        message: "Search index is being built. Please try again later.",
      });
    }
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
