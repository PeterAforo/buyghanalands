/**
 * Meilisearch Client & Search Utilities
 * 
 * Provides full-text search for listings with filters for:
 * - Category, land type, tenure type
 * - Price range, size
 * - Region, district, constituency
 * - Verification status
 */

import { MeiliSearch, Index } from 'meilisearch';

// Initialize Meilisearch client
const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_API_KEY || '',
});

// Index names
export const LISTINGS_INDEX = 'listings';

// Document type for indexed listings
export interface SearchableListing {
  id: string;
  title: string;
  description: string;
  region: string;
  district: string;
  constituency: string | null;
  town: string | null;
  landType: string;
  categoryName: string | null;
  tenureType: string;
  sizeAcres: number;
  priceGhs: number;
  status: string;
  isVerified: boolean;
  sellerId: string;
  sellerName: string;
  createdAt: number; // Unix timestamp for sorting
  updatedAt: number;
  latitude: number | null;
  longitude: number | null;
  imageUrls: string[];
}

// Search filters
export interface ListingSearchFilters {
  region?: string;
  district?: string;
  constituency?: string;
  landType?: string;
  categoryName?: string;
  tenureType?: string;
  minPrice?: number;
  maxPrice?: number;
  minSize?: number;
  maxSize?: number;
  isVerified?: boolean;
  status?: string;
}

// Search options
export interface ListingSearchOptions {
  query?: string;
  filters?: ListingSearchFilters;
  page?: number;
  limit?: number;
  sort?: 'price_asc' | 'price_desc' | 'date_desc' | 'date_asc' | 'size_asc' | 'size_desc';
}

// Search result
export interface ListingSearchResult {
  hits: SearchableListing[];
  totalHits: number;
  page: number;
  totalPages: number;
  processingTimeMs: number;
}

/**
 * Get the listings index
 */
export function getListingsIndex(): Index<SearchableListing> {
  return client.index(LISTINGS_INDEX);
}

/**
 * Initialize the listings index with proper settings
 */
export async function initializeListingsIndex(): Promise<void> {
  const index = getListingsIndex();
  
  // Set searchable attributes
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
  
  // Set filterable attributes
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
  
  // Set sortable attributes
  await index.updateSortableAttributes([
    'priceGhs',
    'sizeAcres',
    'createdAt',
    'updatedAt',
  ]);
  
  // Set ranking rules
  await index.updateRankingRules([
    'words',
    'typo',
    'proximity',
    'attribute',
    'sort',
    'exactness',
  ]);
}

/**
 * Build filter string from search filters
 */
function buildFilterString(filters: ListingSearchFilters): string {
  const conditions: string[] = [];
  
  if (filters.region) {
    conditions.push(`region = "${filters.region}"`);
  }
  if (filters.district) {
    conditions.push(`district = "${filters.district}"`);
  }
  if (filters.constituency) {
    conditions.push(`constituency = "${filters.constituency}"`);
  }
  if (filters.landType) {
    conditions.push(`landType = "${filters.landType}"`);
  }
  if (filters.categoryName) {
    conditions.push(`categoryName = "${filters.categoryName}"`);
  }
  if (filters.tenureType) {
    conditions.push(`tenureType = "${filters.tenureType}"`);
  }
  if (filters.minPrice !== undefined) {
    conditions.push(`priceGhs >= ${filters.minPrice}`);
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(`priceGhs <= ${filters.maxPrice}`);
  }
  if (filters.minSize !== undefined) {
    conditions.push(`sizeAcres >= ${filters.minSize}`);
  }
  if (filters.maxSize !== undefined) {
    conditions.push(`sizeAcres <= ${filters.maxSize}`);
  }
  if (filters.isVerified !== undefined) {
    conditions.push(`isVerified = ${filters.isVerified}`);
  }
  if (filters.status) {
    conditions.push(`status = "${filters.status}"`);
  } else {
    // Default to only showing published listings
    conditions.push(`status = "PUBLISHED"`);
  }
  
  return conditions.join(' AND ');
}

/**
 * Get sort string from sort option
 */
function getSortString(sort?: ListingSearchOptions['sort']): string[] {
  switch (sort) {
    case 'price_asc':
      return ['priceGhs:asc'];
    case 'price_desc':
      return ['priceGhs:desc'];
    case 'date_asc':
      return ['createdAt:asc'];
    case 'date_desc':
      return ['createdAt:desc'];
    case 'size_asc':
      return ['sizeAcres:asc'];
    case 'size_desc':
      return ['sizeAcres:desc'];
    default:
      return ['createdAt:desc'];
  }
}

/**
 * Search listings
 */
export async function searchListings(
  options: ListingSearchOptions
): Promise<ListingSearchResult> {
  const index = getListingsIndex();
  const page = options.page || 1;
  const limit = Math.min(options.limit || 20, 100);
  
  const searchParams: any = {
    offset: (page - 1) * limit,
    limit,
    sort: getSortString(options.sort),
  };
  
  if (options.filters) {
    const filterString = buildFilterString(options.filters);
    if (filterString) {
      searchParams.filter = filterString;
    }
  }
  
  const result = await index.search(options.query || '', searchParams);
  
  return {
    hits: result.hits as SearchableListing[],
    totalHits: result.estimatedTotalHits || 0,
    page,
    totalPages: Math.ceil((result.estimatedTotalHits || 0) / limit),
    processingTimeMs: result.processingTimeMs,
  };
}

/**
 * Index a single listing
 */
export async function indexListing(listing: SearchableListing): Promise<void> {
  const index = getListingsIndex();
  await index.addDocuments([listing]);
}

/**
 * Index multiple listings
 */
export async function indexListings(listings: SearchableListing[]): Promise<void> {
  const index = getListingsIndex();
  await index.addDocuments(listings);
}

/**
 * Update a listing in the index
 */
export async function updateListingIndex(listing: SearchableListing): Promise<void> {
  const index = getListingsIndex();
  await index.updateDocuments([listing]);
}

/**
 * Remove a listing from the index
 */
export async function removeListingFromIndex(listingId: string): Promise<void> {
  const index = getListingsIndex();
  await index.deleteDocument(listingId);
}

/**
 * Remove multiple listings from the index
 */
export async function removeListingsFromIndex(listingIds: string[]): Promise<void> {
  const index = getListingsIndex();
  await index.deleteDocuments(listingIds);
}

/**
 * Clear all listings from the index
 */
export async function clearListingsIndex(): Promise<void> {
  const index = getListingsIndex();
  await index.deleteAllDocuments();
}

/**
 * Get index stats
 */
export async function getIndexStats(): Promise<{
  numberOfDocuments: number;
  isIndexing: boolean;
}> {
  const index = getListingsIndex();
  const stats = await index.getStats();
  return {
    numberOfDocuments: stats.numberOfDocuments,
    isIndexing: stats.isIndexing,
  };
}

/**
 * Check if Meilisearch is healthy
 */
export async function checkMeilisearchHealth(): Promise<boolean> {
  try {
    await client.health();
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert Prisma listing to searchable document
 */
export function listingToSearchDocument(listing: any): SearchableListing {
  return {
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
    isVerified: listing.verificationRequests?.some((v: { status: string }) => v.status === 'APPROVED') || false,
    sellerId: listing.seller.id,
    sellerName: listing.seller.fullName,
    createdAt: new Date(listing.createdAt).getTime(),
    updatedAt: new Date(listing.updatedAt).getTime(),
    latitude: listing.latitude ? Number(listing.latitude) : null,
    longitude: listing.longitude ? Number(listing.longitude) : null,
    imageUrls: listing.media?.map((i: { url: string }) => i.url) || [],
  };
}
