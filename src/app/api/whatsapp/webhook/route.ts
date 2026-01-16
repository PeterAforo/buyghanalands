import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// WhatsApp Cloud API webhook handler
export async function GET(request: NextRequest) {
  // Webhook verification
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Process incoming messages
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (value?.messages) {
      for (const message of value.messages) {
        await handleIncomingMessage(message, value.contacts?.[0]);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}

async function handleIncomingMessage(message: any, contact: any) {
  const phone = message.from;
  const text = message.text?.body?.toLowerCase() || "";
  const messageId = message.id;

  // Get or create conversation state
  let session = await prisma.whatsAppSession.findUnique({
    where: { phone },
  });

  if (!session) {
    session = await prisma.whatsAppSession.create({
      data: {
        phone,
        state: "MAIN_MENU",
        data: {},
      },
    });
  }

  let response = "";
  let newState = session.state;
  let newData = session.data as any;

  // State machine
  switch (session.state) {
    case "MAIN_MENU":
      if (text.includes("hi") || text.includes("hello") || text.includes("start")) {
        response = `👋 Welcome to BuyGhanaLands!

What would you like to do?

1️⃣ Search for land
2️⃣ View my listings
3️⃣ Check my transactions
4️⃣ Get price estimates
5️⃣ Contact support

Reply with a number to continue.`;
      } else if (text === "1") {
        newState = "SEARCH_REGION";
        response = `🔍 *Search for Land*

Select a region:

1. Greater Accra
2. Ashanti
3. Western
4. Central
5. Eastern
6. Northern

Reply with a number.`;
      } else if (text === "2") {
        response = await getMyListings(phone);
      } else if (text === "3") {
        response = await getMyTransactions(phone);
      } else if (text === "4") {
        newState = "PRICE_REGION";
        response = `💰 *Price Estimates*

Select a region:

1. Greater Accra
2. Ashanti
3. Western
4. Central

Reply with a number.`;
      } else if (text === "5") {
        response = `📞 *Contact Support*

Phone: 0302-123456
WhatsApp: 0244-123456
Email: support@buyghanalands.com

Our team is available Mon-Fri, 9am-5pm.

Type "menu" to go back.`;
      } else {
        response = `I didn't understand that. Please reply with a number (1-5) or type "menu" to see options.`;
      }
      break;

    case "SEARCH_REGION":
      const regions = ["Greater Accra", "Ashanti", "Western", "Central", "Eastern", "Northern"];
      const regionIndex = parseInt(text) - 1;
      
      if (regionIndex >= 0 && regionIndex < regions.length) {
        newData.region = regions[regionIndex];
        newState = "SEARCH_TYPE";
        response = `📍 *${regions[regionIndex]}*

Select land type:

1. Residential
2. Commercial
3. Agricultural
4. All types

Reply with a number.`;
      } else if (text === "menu" || text === "0") {
        newState = "MAIN_MENU";
        response = getMainMenu();
      } else {
        response = `Invalid option. Please select 1-6 or type "menu" to go back.`;
      }
      break;

    case "SEARCH_TYPE":
      const types = ["RESIDENTIAL", "COMMERCIAL", "AGRICULTURAL", null];
      const typeIndex = parseInt(text) - 1;
      
      if (typeIndex >= 0 && typeIndex <= 3) {
        newData.landType = types[typeIndex];
        response = await searchListings(newData.region, newData.landType);
        newState = "MAIN_MENU";
        newData = {};
      } else if (text === "menu" || text === "0") {
        newState = "MAIN_MENU";
        response = getMainMenu();
      } else {
        response = `Invalid option. Please select 1-4 or type "menu" to go back.`;
      }
      break;

    case "PRICE_REGION":
      const priceRegions = ["Greater Accra", "Ashanti", "Western", "Central"];
      const priceRegionIndex = parseInt(text) - 1;
      
      if (priceRegionIndex >= 0 && priceRegionIndex < priceRegions.length) {
        response = await getPriceEstimate(priceRegions[priceRegionIndex]);
        newState = "MAIN_MENU";
      } else if (text === "menu" || text === "0") {
        newState = "MAIN_MENU";
        response = getMainMenu();
      } else {
        response = `Invalid option. Please select 1-4 or type "menu" to go back.`;
      }
      break;

    default:
      newState = "MAIN_MENU";
      response = getMainMenu();
  }

  // Update session
  await prisma.whatsAppSession.update({
    where: { phone },
    data: {
      state: newState,
      data: newData,
      lastMessageAt: new Date(),
    },
  });

  // Send response
  await sendWhatsAppMessage(phone, response);
}

function getMainMenu() {
  return `👋 Welcome to BuyGhanaLands!

What would you like to do?

1️⃣ Search for land
2️⃣ View my listings
3️⃣ Check my transactions
4️⃣ Get price estimates
5️⃣ Contact support

Reply with a number to continue.`;
}

async function searchListings(region: string, landType: string | null) {
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
    return `❌ No lands found in ${region}.

Visit buyghanalands.com for more options.

Type "menu" to go back.`;
  }

  let result = `🏡 *Lands in ${region}*\n\n`;
  listings.forEach((l, i) => {
    const price = Number(l.priceGhs);
    const priceStr = price >= 1000000 
      ? `GHS ${(price / 1000000).toFixed(1)}M`
      : `GHS ${(price / 1000).toFixed(0)}K`;
    result += `${i + 1}. *${l.district}*\n   ${priceStr} • ${l.sizeAcres} acres\n\n`;
  });
  result += `\n🌐 Visit buyghanalands.com for details\n\nType "menu" for more options.`;

  return result;
}

async function getMyListings(phone: string) {
  const user = await prisma.user.findFirst({
    where: { phone: { contains: phone.slice(-9) } },
  });

  if (!user) {
    return `❌ No account found for this number.

Register at buyghanalands.com to list your land.

Type "menu" to go back.`;
  }

  const listings = await prisma.listing.findMany({
    where: { sellerId: user.id },
    select: { title: true, status: true, priceGhs: true },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  if (listings.length === 0) {
    return `📋 You have no listings yet.

Create one at buyghanalands.com

Type "menu" to go back.`;
  }

  let result = `📋 *Your Listings*\n\n`;
  listings.forEach((l, i) => {
    const statusEmoji = l.status === "PUBLISHED" ? "✅" : l.status === "DRAFT" ? "📝" : "⏳";
    result += `${i + 1}. ${statusEmoji} ${l.title.substring(0, 25)}...\n`;
  });
  result += `\nType "menu" for more options.`;

  return result;
}

async function getMyTransactions(phone: string) {
  const user = await prisma.user.findFirst({
    where: { phone: { contains: phone.slice(-9) } },
  });

  if (!user) {
    return `❌ No account found for this number.

Register at buyghanalands.com

Type "menu" to go back.`;
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
    return `📊 No transactions found.

Browse lands at buyghanalands.com

Type "menu" to go back.`;
  }

  let result = `📊 *Your Transactions*\n\n`;
  transactions.forEach((t, i) => {
    const statusEmoji = t.status === "RELEASED" ? "✅" : t.status === "FUNDED" ? "💰" : "⏳";
    result += `${i + 1}. ${statusEmoji} ${t.listing.title.substring(0, 20)}...\n   Status: ${t.status}\n\n`;
  });
  result += `\nType "menu" for more options.`;

  return result;
}

async function getPriceEstimate(region: string) {
  const listings = await prisma.listing.findMany({
    where: {
      status: "PUBLISHED",
      region: { contains: region, mode: "insensitive" },
    },
    select: { priceGhs: true, sizeAcres: true, landType: true },
  });

  if (listings.length === 0) {
    return `❌ No price data for ${region}.

Type "menu" to go back.`;
  }

  const byType: { [key: string]: { total: number; acres: number } } = {};
  listings.forEach((l) => {
    if (!byType[l.landType]) byType[l.landType] = { total: 0, acres: 0 };
    byType[l.landType].total += Number(l.priceGhs);
    byType[l.landType].acres += Number(l.sizeAcres);
  });

  let result = `💰 *Price Guide - ${region}*\n\n`;
  for (const [type, data] of Object.entries(byType)) {
    const avgPerAcre = data.acres > 0 ? data.total / data.acres : 0;
    const priceStr = avgPerAcre >= 1000000
      ? `GHS ${(avgPerAcre / 1000000).toFixed(1)}M`
      : `GHS ${(avgPerAcre / 1000).toFixed(0)}K`;
    result += `${type}: ~${priceStr}/acre\n`;
  }
  result += `\n⚠️ Prices are estimates only.\n\nType "menu" for more options.`;

  return result;
}

async function sendWhatsAppMessage(to: string, text: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.error("WhatsApp credentials not configured");
    return;
  }

  try {
    await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    });
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error);
  }
}
