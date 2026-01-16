import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch recent activities from various sources
    const [offers, transactions, messages, listings] = await Promise.all([
      // Recent offers (sent and received)
      prisma.offer.findMany({
        where: {
          OR: [
            { buyerId: userId },
            { listing: { sellerId: userId } },
          ],
        },
        include: {
          listing: { select: { title: true, sellerId: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      // Recent transactions
      prisma.transaction.findMany({
        where: {
          OR: [
            { buyerId: userId },
            { sellerId: userId },
          ],
        },
        include: {
          listing: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      // Recent messages received
      prisma.message.findMany({
        where: { receiverId: userId },
        include: {
          sender: { select: { fullName: true } },
          listing: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      // Recent listing updates
      prisma.listing.findMany({
        where: { sellerId: userId },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

    // Transform to activity format
    const activities: any[] = [];

    offers.forEach((offer) => {
      const isSeller = offer.listing.sellerId === userId;
      activities.push({
        id: `offer-${offer.id}`,
        type: "offer",
        title: isSeller ? "New Offer Received" : `Offer ${offer.status.toLowerCase()}`,
        description: `${isSeller ? "Offer on" : "Your offer for"} "${offer.listing.title}"`,
        createdAt: offer.createdAt.toISOString(),
        link: `/dashboard/offers`,
      });
    });

    transactions.forEach((tx) => {
      activities.push({
        id: `tx-${tx.id}`,
        type: "transaction",
        title: `Transaction ${tx.status.replace("_", " ").toLowerCase()}`,
        description: `"${tx.listing.title}"`,
        createdAt: tx.createdAt.toISOString(),
        link: `/dashboard/transactions/${tx.id}`,
      });
    });

    messages.forEach((msg) => {
      activities.push({
        id: `msg-${msg.id}`,
        type: "message",
        title: "New Message",
        description: `From ${msg.sender.fullName}${msg.listing ? ` about "${msg.listing.title}"` : ""}`,
        createdAt: msg.createdAt.toISOString(),
        link: `/messages`,
      });
    });

    listings.forEach((listing) => {
      if (listing.status === "PUBLISHED" && listing.publishedAt) {
        activities.push({
          id: `listing-pub-${listing.id}`,
          type: "listing",
          title: "Listing Published",
          description: `"${listing.title}" is now live`,
          createdAt: listing.publishedAt.toISOString(),
          link: `/listings/${listing.id}`,
        });
      }
    });

    // Sort by date and limit
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(activities.slice(0, 20));
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
