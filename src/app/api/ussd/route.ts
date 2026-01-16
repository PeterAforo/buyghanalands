import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// USSD Session state management (in-memory for simplicity, use Redis in production)
const sessions: Map<string, { state: string; data: any; lastAccess: number }> = new Map();

// Clean up old sessions (older than 5 minutes)
function cleanupSessions() {
  const now = Date.now();
  for (const [key, session] of sessions) {
    if (now - session.lastAccess > 5 * 60 * 1000) {
      sessions.delete(key);
    }
  }
}

// Format price for display
function formatPrice(price: bigint | number): string {
  const num = typeof price === 'bigint' ? Number(price) : price;
  if (num >= 1000000) {
    return `GHS ${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `GHS ${(num / 1000).toFixed(0)}K`;
  }
  return `GHS ${num}`;
}

export async function POST(request: NextRequest) {
  try {
    cleanupSessions();

    // Parse USSD request (format varies by provider)
    const formData = await request.formData();
    const sessionId = formData.get("sessionId") as string || formData.get("SessionId") as string;
    const phoneNumber = formData.get("phoneNumber") as string || formData.get("MSISDN") as string;
    const text = formData.get("text") as string || formData.get("ussdString") as string || "";
    const serviceCode = formData.get("serviceCode") as string || "*920#";

    if (!sessionId || !phoneNumber) {
      return new NextResponse("END Invalid request", { status: 200 });
    }

    // Get or create session
    let session = sessions.get(sessionId);
    if (!session) {
      session = { state: "main_menu", data: {}, lastAccess: Date.now() };
      sessions.set(sessionId, session);
    }
    session.lastAccess = Date.now();

    // Parse user input
    const inputs = text.split("*").filter(Boolean);
    const currentInput = inputs[inputs.length - 1] || "";

    let response = "";

    // State machine for USSD flow
    switch (session.state) {
      case "main_menu":
        if (!currentInput) {
          response = `CON Welcome to BuyGhanaLands
1. Search Lands
2. My Listings
3. My Transactions
4. Check Prices
5. Contact Support`;
        } else {
          switch (currentInput) {
            case "1":
              session.state = "search_region";
              response = `CON Select Region:
1. Greater Accra
2. Ashanti
3. Western
4. Central
5. Eastern
6. Northern
0. Back`;
              break;
            case "2":
              session.state = "my_listings";
              session.data.phone = phoneNumber;
              response = await getMyListings(phoneNumber);
              break;
            case "3":
              session.state = "my_transactions";
              response = await getMyTransactions(phoneNumber);
              break;
            case "4":
              session.state = "check_prices";
              response = `CON Check Land Prices:
1. Greater Accra
2. Ashanti
3. Western
4. Central
0. Back`;
              break;
            case "5":
              response = `END Contact Support:
Phone: 0302-123456
WhatsApp: 0244-123456
Email: support@buyghanalands.com`;
              break;
            default:
              response = `CON Invalid option. Try again:
1. Search Lands
2. My Listings
3. My Transactions
4. Check Prices
5. Contact Support`;
          }
        }
        break;

      case "search_region":
        if (currentInput === "0") {
          session.state = "main_menu";
          response = `CON Welcome to BuyGhanaLands
1. Search Lands
2. My Listings
3. My Transactions
4. Check Prices
5. Contact Support`;
        } else {
          const regions = ["Greater Accra", "Ashanti", "Western", "Central", "Eastern", "Northern"];
          const regionIndex = parseInt(currentInput) - 1;
          if (regionIndex >= 0 && regionIndex < regions.length) {
            session.data.region = regions[regionIndex];
            session.state = "search_type";
            response = `CON Land Type in ${regions[regionIndex]}:
1. Residential
2. Commercial
3. Agricultural
4. All Types
0. Back`;
          } else {
            response = `CON Invalid option. Select Region:
1. Greater Accra
2. Ashanti
3. Western
4. Central
5. Eastern
6. Northern
0. Back`;
          }
        }
        break;

      case "search_type":
        if (currentInput === "0") {
          session.state = "search_region";
          response = `CON Select Region:
1. Greater Accra
2. Ashanti
3. Western
4. Central
5. Eastern
6. Northern
0. Back`;
        } else {
          const types = ["RESIDENTIAL", "COMMERCIAL", "AGRICULTURAL", null];
          const typeIndex = parseInt(currentInput) - 1;
          if (typeIndex >= 0 && typeIndex <= 3) {
            session.data.landType = types[typeIndex];
            response = await searchListings(session.data.region, session.data.landType);
            session.state = "main_menu";
          } else {
            response = `CON Invalid option. Land Type:
1. Residential
2. Commercial
3. Agricultural
4. All Types
0. Back`;
          }
        }
        break;

      case "check_prices":
        if (currentInput === "0") {
          session.state = "main_menu";
          response = `CON Welcome to BuyGhanaLands
1. Search Lands
2. My Listings
3. My Transactions
4. Check Prices
5. Contact Support`;
        } else {
          const regions = ["Greater Accra", "Ashanti", "Western", "Central"];
          const regionIndex = parseInt(currentInput) - 1;
          if (regionIndex >= 0 && regionIndex < regions.length) {
            response = await getPriceGuide(regions[regionIndex]);
            session.state = "main_menu";
          } else {
            response = `CON Invalid option. Check Prices:
1. Greater Accra
2. Ashanti
3. Western
4. Central
0. Back`;
          }
        }
        break;

      default:
        session.state = "main_menu";
        response = `CON Welcome to BuyGhanaLands
1. Search Lands
2. My Listings
3. My Transactions
4. Check Prices
5. Contact Support`;
    }

    sessions.set(sessionId, session);

    return new NextResponse(response, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("USSD error:", error);
    return new NextResponse("END An error occurred. Please try again.", { status: 200 });
  }
}

async function searchListings(region: string, landType: string | null): Promise<string> {
  try {
    const where: any = {
      status: "PUBLISHED",
      region: { contains: region, mode: "insensitive" },
    };
    if (landType) where.landType = landType;

    const listings = await prisma.listing.findMany({
      where,
      select: {
        title: true,
        district: true,
        priceGhs: true,
        sizeAcres: true,
      },
      take: 5,
      orderBy: { publishedAt: "desc" },
    });

    if (listings.length === 0) {
      return `END No lands found in ${region}.
Visit buyghanalands.com for more options.`;
    }

    let result = `END Lands in ${region}:\n`;
    listings.forEach((l, i) => {
      result += `${i + 1}. ${l.district} - ${formatPrice(l.priceGhs)} (${l.sizeAcres} acres)\n`;
    });
    result += `\nVisit buyghanalands.com for details`;

    return result;
  } catch (error) {
    return `END Error searching. Try again later.`;
  }
}

async function getMyListings(phone: string): Promise<string> {
  try {
    const user = await prisma.user.findFirst({
      where: { phone: { contains: phone.slice(-9) } },
      select: { id: true },
    });

    if (!user) {
      return `END No account found for this number.
Register at buyghanalands.com`;
    }

    const listings = await prisma.listing.findMany({
      where: { sellerId: user.id },
      select: {
        title: true,
        status: true,
        priceGhs: true,
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    if (listings.length === 0) {
      return `END You have no listings.
Create one at buyghanalands.com`;
    }

    let result = `END Your Listings:\n`;
    listings.forEach((l, i) => {
      result += `${i + 1}. ${l.title.substring(0, 20)}... - ${l.status}\n`;
    });

    return result;
  } catch (error) {
    return `END Error fetching listings.`;
  }
}

async function getMyTransactions(phone: string): Promise<string> {
  try {
    const user = await prisma.user.findFirst({
      where: { phone: { contains: phone.slice(-9) } },
      select: { id: true },
    });

    if (!user) {
      return `END No account found for this number.
Register at buyghanalands.com`;
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ buyerId: user.id }, { sellerId: user.id }],
      },
      select: {
        status: true,
        agreedPriceGhs: true,
        listing: { select: { title: true } },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    if (transactions.length === 0) {
      return `END No transactions found.
Browse lands at buyghanalands.com`;
    }

    let result = `END Your Transactions:\n`;
    transactions.forEach((t, i) => {
      result += `${i + 1}. ${t.listing.title.substring(0, 15)}... - ${t.status}\n`;
    });

    return result;
  } catch (error) {
    return `END Error fetching transactions.`;
  }
}

async function getPriceGuide(region: string): Promise<string> {
  try {
    const listings = await prisma.listing.findMany({
      where: {
        status: "PUBLISHED",
        region: { contains: region, mode: "insensitive" },
      },
      select: {
        priceGhs: true,
        sizeAcres: true,
        landType: true,
      },
    });

    if (listings.length === 0) {
      return `END No price data for ${region}.
Check buyghanalands.com`;
    }

    // Calculate average price per acre by type
    const byType: { [key: string]: { total: number; acres: number } } = {};
    listings.forEach((l) => {
      if (!byType[l.landType]) {
        byType[l.landType] = { total: 0, acres: 0 };
      }
      byType[l.landType].total += Number(l.priceGhs);
      byType[l.landType].acres += Number(l.sizeAcres);
    });

    let result = `END Price Guide - ${region}:\n`;
    for (const [type, data] of Object.entries(byType)) {
      const avgPerAcre = data.acres > 0 ? data.total / data.acres : 0;
      result += `${type}: ~${formatPrice(avgPerAcre)}/acre\n`;
    }
    result += `\nPrices are estimates only.`;

    return result;
  } catch (error) {
    return `END Error fetching prices.`;
  }
}

// Also support GET for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    service: "BuyGhanaLands USSD",
    status: "active",
    shortcode: "*920#",
    description: "Access land listings via USSD",
  });
}
