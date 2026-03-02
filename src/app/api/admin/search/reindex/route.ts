import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { 
  initializeListingsIndex, 
  indexListings, 
  clearListingsIndex,
  listingToSearchDocument,
  getIndexStats 
} from "@/lib/meilisearch";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    });

    if (!user?.roles.includes("ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Initialize index settings
    await initializeListingsIndex();

    // Clear existing documents
    await clearListingsIndex();

    // Fetch all published listings
    const listings = await prisma.listing.findMany({
      where: {
        status: "PUBLISHED",
      },
      include: {
        seller: {
          select: { id: true, fullName: true },
        },
        category: {
          select: { name: true },
        },
        media: {
          select: { url: true },
          take: 5,
        },
        verificationRequests: {
          select: { status: true },
        },
      },
    });

    // Convert to searchable documents
    const documents = listings.map(listingToSearchDocument);

    // Index all documents
    if (documents.length > 0) {
      await indexListings(documents);
    }

    // Get stats
    const stats = await getIndexStats();

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "USER",
        entityId: session.user.id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "SEARCH_REINDEX",
        diff: { 
          documentsIndexed: documents.length,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully indexed ${documents.length} listings`,
      stats,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to reindex listings" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getIndexStats();

    return NextResponse.json({
      stats,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get index stats" },
      { status: 500 }
    );
  }
}
