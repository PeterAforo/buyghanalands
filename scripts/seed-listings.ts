/**
 * Seed Sample Listings
 * Run with: npx tsx scripts/seed-listings.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleListings = [
  {
    title: "Prime Residential Land in East Legon",
    description: "Beautiful 1-acre plot in the heart of East Legon, perfect for residential development. Close to American International School and major shopping centers. All utilities available including water, electricity, and fiber internet. Gated community with 24/7 security.",
    region: "Greater Accra",
    district: "Ayawaso West",
    constituency: "Ayawaso West Wuogon",
    town: "East Legon",
    landType: "RESIDENTIAL",
    tenureType: "FREEHOLD",
    sizeAcres: 1.0,
    priceGhs: 2500000,
    latitude: 5.6350,
    longitude: -0.1550,
  },
  {
    title: "Commercial Plot at Spintex Road",
    description: "Strategic commercial land on Spintex Road, ideal for office complex or retail development. High traffic area with excellent visibility. 2 acres with road frontage. Title documents ready for immediate transfer.",
    region: "Greater Accra",
    district: "Tema West",
    constituency: "Tema West",
    town: "Spintex",
    landType: "COMMERCIAL",
    tenureType: "FREEHOLD",
    sizeAcres: 2.0,
    priceGhs: 5000000,
    latitude: 5.6450,
    longitude: -0.0850,
  },
  {
    title: "Agricultural Land in Volta Region",
    description: "Fertile agricultural land perfect for farming. 50 acres with access to water source. Suitable for cocoa, palm oil, or mixed farming. Good road access and close to local markets.",
    region: "Volta",
    district: "Ho Municipal",
    constituency: "Ho Central",
    town: "Ho",
    landType: "AGRICULTURAL",
    tenureType: "LEASEHOLD",
    leaseDurationYears: 50,
    sizeAcres: 50.0,
    priceGhs: 800000,
    latitude: 6.6000,
    longitude: 0.4700,
  },
  {
    title: "Beachfront Property at Ada Foah",
    description: "Stunning beachfront land at Ada Foah, perfect for resort or hospitality development. 5 acres with direct beach access. Breathtaking views of the Volta River estuary. Rare opportunity for tourism investment.",
    region: "Greater Accra",
    district: "Ada East",
    constituency: "Ada",
    town: "Ada Foah",
    landType: "MIXED_USE",
    tenureType: "FREEHOLD",
    sizeAcres: 5.0,
    priceGhs: 15000000,
    latitude: 5.7850,
    longitude: 0.6350,
  },
  {
    title: "Industrial Land at Tema Free Zone",
    description: "Prime industrial land within Tema Free Zone enclave. 10 acres with all industrial utilities. Tax incentives available. Perfect for manufacturing or warehousing operations.",
    region: "Greater Accra",
    district: "Tema Metropolitan",
    constituency: "Tema Central",
    town: "Tema",
    landType: "INDUSTRIAL",
    tenureType: "LEASEHOLD",
    leaseDurationYears: 99,
    sizeAcres: 10.0,
    priceGhs: 25000000,
    latitude: 5.6700,
    longitude: -0.0167,
  },
  {
    title: "Residential Plots at Oyibi",
    description: "Affordable residential plots in fast-developing Oyibi area. 0.5 acre plots available. Close to Valley View University. Good investment opportunity as area is rapidly developing.",
    region: "Greater Accra",
    district: "Kpone Katamanso",
    constituency: "Kpone Katamanso",
    town: "Oyibi",
    landType: "RESIDENTIAL",
    tenureType: "FREEHOLD",
    sizeAcres: 0.5,
    priceGhs: 150000,
    latitude: 5.7200,
    longitude: -0.0500,
  },
  {
    title: "Farmland in Ashanti Region",
    description: "Large agricultural land in the heart of Ashanti Region. 100 acres suitable for large-scale farming. Rich soil perfect for cocoa cultivation. Access road and nearby water source.",
    region: "Ashanti",
    district: "Kumasi Metropolitan",
    constituency: "Asokwa",
    town: "Kumasi",
    landType: "AGRICULTURAL",
    tenureType: "CUSTOMARY",
    sizeAcres: 100.0,
    priceGhs: 2000000,
    latitude: 6.6885,
    longitude: -1.6244,
  },
  {
    title: "Serviced Plots at Trasacco Valley",
    description: "Premium serviced plots in exclusive Trasacco Valley estate. 0.75 acres with all utilities connected. Gated community with golf course access. High-end neighborhood.",
    region: "Greater Accra",
    district: "Ayawaso East",
    constituency: "Ayawaso East",
    town: "East Legon Hills",
    landType: "RESIDENTIAL",
    tenureType: "FREEHOLD",
    sizeAcres: 0.75,
    priceGhs: 3500000,
    latitude: 5.6500,
    longitude: -0.1400,
  },
  {
    title: "Development Land at Takoradi",
    description: "Strategic development land in Takoradi, Western Region. 3 acres near the port area. Ideal for commercial or mixed-use development. Growing oil & gas sector driving demand.",
    region: "Western",
    district: "Sekondi Takoradi Metropolitan",
    constituency: "Takoradi",
    town: "Takoradi",
    landType: "MIXED_USE",
    tenureType: "FREEHOLD",
    sizeAcres: 3.0,
    priceGhs: 4500000,
    latitude: 4.8845,
    longitude: -1.7554,
  },
  {
    title: "Residential Land at Kasoa",
    description: "Affordable residential land in Kasoa, Central Region. 1 acre plot in developing area. Good road network and close to Accra. Perfect for family home or rental development.",
    region: "Central",
    district: "Awutu Senya East",
    constituency: "Awutu Senya East",
    town: "Kasoa",
    landType: "RESIDENTIAL",
    tenureType: "FREEHOLD",
    sizeAcres: 1.0,
    priceGhs: 300000,
    latitude: 5.5333,
    longitude: -0.4167,
  },
];

async function main() {
  console.log('🌱 Seeding sample listings...');

  // First, ensure we have a seller user
  let seller = await prisma.user.findFirst({
    where: { roles: { has: 'SELLER' } },
  });

  if (!seller) {
    console.log('📝 Creating seller user...');
    seller = await prisma.user.create({
      data: {
        email: 'seller@buyghanalands.com',
        fullName: 'Ghana Land Seller',
        phone: '+233201234567',
        roles: ['SELLER'],
        emailVerified: new Date(),
        accountStatus: 'ACTIVE',
        kycTier: 'TIER_1',
      },
    });
    console.log(`   Created seller: ${seller.email}`);
  } else {
    console.log(`   Using existing seller: ${seller.email}`);
  }

  // Create listings
  let created = 0;
  for (const listing of sampleListings) {
    try {
      await prisma.listing.create({
        data: {
          sellerId: seller.id,
          title: listing.title,
          description: listing.description,
          region: listing.region,
          district: listing.district,
          constituency: listing.constituency,
          town: listing.town,
          landType: listing.landType as any,
          tenureType: listing.tenureType as any,
          leaseDurationYears: listing.leaseDurationYears,
          sizeAcres: listing.sizeAcres,
          priceGhs: BigInt(listing.priceGhs),
          latitude: listing.latitude,
          longitude: listing.longitude,
          status: 'PUBLISHED',
          publishedAt: new Date(),
          negotiable: true,
          totalPlots: 1,
          availablePlots: 1,
        },
      });
      created++;
      console.log(`✅ Created: ${listing.title}`);
    } catch (error: any) {
      console.log(`⚠️  Skipped (may already exist): ${listing.title}`);
    }
  }

  console.log(`\n🎉 Created ${created} listings`);

  // Now index them in Meilisearch
  console.log('\n📤 Indexing listings in Meilisearch...');
  
  const { execSync } = await import('child_process');
  execSync('npx tsx scripts/init-search-index.ts', { 
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
