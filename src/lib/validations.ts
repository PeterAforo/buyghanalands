import { z } from "zod";

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
