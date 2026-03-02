/**
 * Initialize Meilisearch Index
 * Run with: npx tsx scripts/init-search-index.ts
 */

import { PrismaClient } from '@prisma/client';
import { MeiliSearch } from 'meilisearch';

const prisma = new PrismaClient();

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_API_KEY || '',
});

const LISTINGS_INDEX = 'listings';

async function main() {
  console.log('🔍 Initializing Meilisearch index...');
  console.log(`   Host: ${process.env.MEILISEARCH_HOST}`);

  // Check health
  try {
    const health = await client.health();
    console.log('✅ Meilisearch is healthy:', health);
  } catch (error) {
    console.error('❌ Meilisearch is not reachable:', error);
    process.exit(1);
  }

  // Create or get index
  console.log('📦 Creating/getting listings index...');
  const index = client.index(LISTINGS_INDEX);

  // Configure index settings
  console.log('⚙️  Configuring index settings...');
  
  await index.updateSearchableAttributes([
    'title',
    'description',
    'region',
    'district',
    'constituency',
    'town',
    'landType',
    'categoryName',
    'sellerName',
  ]);

  await index.updateFilterableAttributes([
    'region',
    'district',
    'constituency',
    'landType',
    'categoryName',
    'tenureType',
    'priceGhs',
    'sizeAcres',
    'isVerified',
    'status',
    'sellerId',
  ]);

  await index.updateSortableAttributes([
    'priceGhs',
    'sizeAcres',
    'createdAt',
    'updatedAt',
  ]);

  await index.updateRankingRules([
    'words',
    'typo',
    'proximity',
    'attribute',
    'sort',
    'exactness',
  ]);

  console.log('✅ Index settings configured');

  // Fetch published listings
  console.log('📥 Fetching published listings from database...');
  const listings = await prisma.listing.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      seller: { select: { id: true, fullName: true } },
      category: { select: { name: true } },
      media: { select: { url: true }, take: 5 },
      verificationRequests: { select: { status: true } },
    },
  });

  console.log(`   Found ${listings.length} published listings`);

  if (listings.length === 0) {
    console.log('⚠️  No published listings to index');
    await prisma.$disconnect();
    return;
  }

  // Convert to searchable documents
  const documents = listings.map((listing) => ({
    id: listing.id,
    title: listing.title,
    description: listing.description,
    region: listing.region,
    district: listing.district,
    constituency: listing.constituency,
    town: listing.town,
    landType: listing.landType,
    categoryName: listing.category?.name || null,
    tenureType: listing.tenureType,
    sizeAcres: Number(listing.sizeAcres),
    priceGhs: Number(listing.priceGhs),
    status: listing.status,
    isVerified: listing.verificationRequests?.some((v) => v.status === 'APPROVED') || false,
    sellerId: listing.seller.id,
    sellerName: listing.seller.fullName,
    createdAt: new Date(listing.createdAt).getTime(),
    updatedAt: new Date(listing.updatedAt).getTime(),
    latitude: listing.latitude ? Number(listing.latitude) : null,
    longitude: listing.longitude ? Number(listing.longitude) : null,
    imageUrls: listing.media?.map((i) => i.url) || [],
  }));

  // Index documents
  console.log('📤 Indexing documents...');
  const task = await index.addDocuments(documents);
  console.log(`✅ Indexing task created: ${task.taskUid}`);

  // Wait for indexing to complete
  console.log('⏳ Waiting for indexing to complete...');
  await client.waitForTask(task.taskUid);
  console.log('✅ Indexing complete!');

  // Get stats
  const stats = await index.getStats();
  console.log(`📊 Index stats: ${stats.numberOfDocuments} documents indexed`);

  await prisma.$disconnect();
  console.log('🎉 Done!');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
