import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "url parameter is required" },
        { status: 400 }
      );
    }

    // Parse the deep link URL
    // Expected formats:
    // buyghanalands://listings/{id}
    // buyghanalands://offers/{id}
    // buyghanalands://transactions/{id}
    // buyghanalands://messages/{conversationId}
    // https://buyghanalands.com/listings/{id}

    let path: string;
    
    if (url.startsWith("buyghanalands://")) {
      path = url.replace("buyghanalands://", "");
    } else if (url.includes("buyghanalands.com")) {
      const urlObj = new URL(url);
      path = urlObj.pathname.replace(/^\//, "");
    } else {
      path = url.replace(/^\//, "");
    }

    const parts = path.split("/").filter(Boolean);
    
    if (parts.length < 1) {
      return NextResponse.json({
        type: "home",
        screen: "Home",
        params: {},
      });
    }

    const resourceType = parts[0];
    const resourceId = parts[1];

    switch (resourceType) {
      case "listings":
        if (resourceId) {
          const listing = await prisma.listing.findUnique({
            where: { id: resourceId },
            select: { id: true, title: true, status: true },
          });
          
          if (!listing) {
            return NextResponse.json(
              { error: "Listing not found" },
              { status: 404 }
            );
          }
          
          return NextResponse.json({
            type: "listing",
            screen: "ListingDetails",
            params: { id: resourceId },
            resource: listing,
          });
        }
        return NextResponse.json({
          type: "listings",
          screen: "Listings",
          params: {},
        });

      case "offers":
        if (resourceId) {
          const offer = await prisma.offer.findUnique({
            where: { id: resourceId },
            select: { id: true, status: true, listingId: true },
          });
          
          if (!offer) {
            return NextResponse.json(
              { error: "Offer not found" },
              { status: 404 }
            );
          }
          
          return NextResponse.json({
            type: "offer",
            screen: "OfferDetails",
            params: { id: resourceId },
            resource: offer,
          });
        }
        return NextResponse.json({
          type: "offers",
          screen: "MyOffers",
          params: {},
        });

      case "transactions":
        if (resourceId) {
          const transaction = await prisma.transaction.findUnique({
            where: { id: resourceId },
            select: { id: true, status: true },
          });
          
          if (!transaction) {
            return NextResponse.json(
              { error: "Transaction not found" },
              { status: 404 }
            );
          }
          
          return NextResponse.json({
            type: "transaction",
            screen: "TransactionDetails",
            params: { id: resourceId },
            resource: transaction,
          });
        }
        return NextResponse.json({
          type: "transactions",
          screen: "MyTransactions",
          params: {},
        });

      case "messages":
        if (resourceId) {
          return NextResponse.json({
            type: "conversation",
            screen: "Chat",
            params: { conversationId: resourceId },
          });
        }
        return NextResponse.json({
          type: "messages",
          screen: "Messages",
          params: {},
        });

      case "profile":
        return NextResponse.json({
          type: "profile",
          screen: "Profile",
          params: {},
        });

      case "favorites":
        return NextResponse.json({
          type: "favorites",
          screen: "Favorites",
          params: {},
        });

      case "notifications":
        return NextResponse.json({
          type: "notifications",
          screen: "Notifications",
          params: {},
        });

      default:
        return NextResponse.json({
          type: "unknown",
          screen: "Home",
          params: {},
          originalPath: path,
        });
    }
  } catch (error) {
    console.error("Deep link resolution error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
