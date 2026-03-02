import { z } from "zod";

/**
 * Validate request body against a Zod schema
 * Returns parsed data or validation errors
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Array<{ field: string; message: string }> } {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map(i => ({
        field: i.path.join("."),
        message: i.message,
      })),
    };
  }
  
  return { success: true, data: result.data };
}

// Common field schemas
export const phoneSchema = z
  .string()
  .min(10, "Phone number must be at least 10 digits")
  .regex(/^[0-9+]+$/, "Invalid phone number");

export const offerSchema = z.object({
  listingId: z.string().min(1, "Listing ID is required"),
  amountGhs: z.number().positive("Amount must be positive"),
  message: z.string().optional(),
  expiresInDays: z.number().min(1).max(30).default(7),
});

export const transactionSchema = z.object({
  offerId: z.string().min(1, "Offer ID is required"),
});

export const disputeSchema = z.object({
  transactionId: z.string().min(1, "Transaction ID is required"),
  summary: z.string().min(10, "Summary must be at least 10 characters"),
  details: z.string().optional(),
});

export const messageSchema = z.object({
  receiverId: z.string().min(1, "Receiver ID is required"),
  body: z.string().min(1, "Message body is required"),
  listingId: z.string().optional(),
  transactionId: z.string().optional(),
});

export const verificationRequestSchema = z.object({
  listingId: z.string().min(1, "Listing ID is required"),
  levelRequested: z.enum([
    "LEVEL_1_DOCS_UPLOADED",
    "LEVEL_2_PLATFORM_REVIEWED",
    "LEVEL_3_OFFICIAL_VERIFIED",
  ]),
});

export const serviceRequestSchema = z.object({
  professionalId: z.string().optional(),
  serviceId: z.string().optional(),
  listingId: z.string().optional(),
  transactionId: z.string().optional(),
  title: z.string().min(5, "Title must be at least 5 characters"),
  details: z.string().optional(),
  preferredDate: z.string().optional(),
  locationNote: z.string().optional(),
  offerPriceGhs: z.number().optional(),
});

export const permitApplicationSchema = z.object({
  assemblyId: z.string().min(1, "Assembly is required"),
  listingId: z.string().optional(),
  transactionId: z.string().optional(),
  projectTitle: z.string().min(5, "Project title is required"),
  projectDescription: z.string().optional(),
  landLocationNote: z.string().optional(),
  plotSizeNote: z.string().optional(),
  estimatedCostGhs: z.number().optional(),
  buildingType: z.string().optional(),
  storeys: z.number().optional(),
});

export const reportSchema = z.object({
  targetType: z.enum(["LISTING", "USER", "MESSAGE", "TRANSACTION"]),
  targetId: z.string().min(1, "Target ID is required"),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  details: z.string().optional(),
});

// Listing schemas
export const createListingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z.string().min(20, "Description must be at least 20 characters"),
  region: z.string().min(1, "Region is required"),
  district: z.string().min(1, "District is required"),
  constituency: z.string().optional(),
  town: z.string().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  landType: z.enum(["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "AGRICULTURAL", "MIXED"]),
  tenureType: z.enum(["FREEHOLD", "LEASEHOLD", "CUSTOMARY"]),
  leaseDurationYears: z.number().optional().nullable(),
  sizeAcres: z.number().positive("Size must be positive"),
  totalPlots: z.number().int().positive().default(1),
  availablePlots: z.number().int().positive().default(1),
  priceGhs: z.number().positive("Price must be positive"),
  pricePerPlotGhs: z.number().optional().nullable(),
  negotiable: z.boolean().default(true),
});

export const updateListingSchema = createListingSchema.partial();

// Payment schemas
export const initializePaymentSchema = z.object({
  transactionId: z.string().optional(),
  listingId: z.string().optional(),
  amount: z.number().positive("Amount must be positive"),
  email: z.string().email("Valid email required"),
  paymentType: z.enum(["LISTING_FEE", "TRANSACTION_FUNDING", "SERVICE_FEE"]).default("TRANSACTION_FUNDING"),
  callbackUrl: z.string().url().optional(),
});

// Favorite schema
export const favoriteSchema = z.object({
  listingId: z.string().min(1, "Listing ID is required"),
});

// Saved search schema
export const savedSearchSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  criteria: z.object({
    region: z.string().optional(),
    district: z.string().optional(),
    landType: z.string().optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    minSize: z.number().optional(),
    maxSize: z.number().optional(),
  }),
  notifyEmail: z.boolean().default(true),
  notifySms: z.boolean().default(false),
});

// Support ticket schema
export const supportTicketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters").max(200),
  body: z.string().min(10, "Message must be at least 10 characters"),
  transactionId: z.string().optional(),
});

// ID parameter schema
export const idParamSchema = z.object({
  id: z.string().min(1, "ID is required"),
});
