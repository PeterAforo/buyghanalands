import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  return user?.roles.some((role) => ["ADMIN", "FINANCE"].includes(role)) || false;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Funnel metrics
    const [
      totalListings,
      publishedListings,
      listingsWithOffers,
      acceptedOffers,
      fundedTransactions,
      completedTransactions,
    ] = await Promise.all([
      prisma.listing.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.listing.count({
        where: {
          createdAt: { gte: startDate },
          status: "PUBLISHED",
        },
      }),
      prisma.listing.count({
        where: {
          createdAt: { gte: startDate },
          offers: { some: {} },
        },
      }),
      prisma.offer.count({
        where: {
          createdAt: { gte: startDate },
          status: "ACCEPTED",
        },
      }),
      prisma.transaction.count({
        where: {
          createdAt: { gte: startDate },
          status: { in: ["FUNDED", "VERIFICATION_PERIOD", "READY_TO_RELEASE", "RELEASED", "CLOSED"] },
        },
      }),
      prisma.transaction.count({
        where: {
          createdAt: { gte: startDate },
          status: { in: ["RELEASED", "CLOSED"] },
        },
      }),
    ]);

    // Calculate conversion rates
    const listingToPublished = totalListings > 0 ? (publishedListings / totalListings) * 100 : 0;
    const publishedToOffer = publishedListings > 0 ? (listingsWithOffers / publishedListings) * 100 : 0;
    const offerToAccepted = listingsWithOffers > 0 ? (acceptedOffers / listingsWithOffers) * 100 : 0;
    const acceptedToFunded = acceptedOffers > 0 ? (fundedTransactions / acceptedOffers) * 100 : 0;
    const fundedToCompleted = fundedTransactions > 0 ? (completedTransactions / fundedTransactions) * 100 : 0;
    const overallConversion = totalListings > 0 ? (completedTransactions / totalListings) * 100 : 0;

    // User conversion
    const [totalUsers, usersWithListings, usersWithTransactions] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: startDate } } }),
      prisma.user.count({
        where: {
          createdAt: { gte: startDate },
          listings: { some: {} },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: startDate },
          OR: [
            { transactionsAsBuyer: { some: {} } },
            { transactionsAsSeller: { some: {} } },
          ],
        },
      }),
    ]);

    const userToSeller = totalUsers > 0 ? (usersWithListings / totalUsers) * 100 : 0;
    const userToTransactor = totalUsers > 0 ? (usersWithTransactions / totalUsers) * 100 : 0;

    // Verification conversion
    const [verificationRequests, completedVerifications] = await Promise.all([
      prisma.verificationRequest.count({ where: { createdAt: { gte: startDate } } }),
      prisma.verificationRequest.count({
        where: {
          createdAt: { gte: startDate },
          status: "COMPLETED",
        },
      }),
    ]);

    const verificationSuccessRate = verificationRequests > 0
      ? (completedVerifications / verificationRequests) * 100
      : 0;

    return NextResponse.json({
      period: `${days} days`,
      startDate: startDate.toISOString(),
      funnel: {
        stages: [
          { name: "Listings Created", count: totalListings },
          { name: "Listings Published", count: publishedListings },
          { name: "Listings with Offers", count: listingsWithOffers },
          { name: "Offers Accepted", count: acceptedOffers },
          { name: "Transactions Funded", count: fundedTransactions },
          { name: "Transactions Completed", count: completedTransactions },
        ],
        conversionRates: {
          listingToPublished: Math.round(listingToPublished * 10) / 10,
          publishedToOffer: Math.round(publishedToOffer * 10) / 10,
          offerToAccepted: Math.round(offerToAccepted * 10) / 10,
          acceptedToFunded: Math.round(acceptedToFunded * 10) / 10,
          fundedToCompleted: Math.round(fundedToCompleted * 10) / 10,
          overall: Math.round(overallConversion * 10) / 10,
        },
      },
      users: {
        total: totalUsers,
        withListings: usersWithListings,
        withTransactions: usersWithTransactions,
        conversionToSeller: Math.round(userToSeller * 10) / 10,
        conversionToTransactor: Math.round(userToTransactor * 10) / 10,
      },
      verification: {
        requests: verificationRequests,
        completed: completedVerifications,
        successRate: Math.round(verificationSuccessRate * 10) / 10,
      },
    });
  } catch (error) {
    console.error("Error fetching conversion analytics:", error);
    return NextResponse.json({ error: "Failed to fetch conversion analytics" }, { status: 500 });
  }
}
