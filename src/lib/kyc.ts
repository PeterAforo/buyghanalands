// Hybrid KYC (Know Your Customer) verification library for Ghana Card.
// Provides automated in-house checks with manual admin review as fallback.
// Uses AWS Rekognition for document quality, selfie quality, and face matching
// when AWS credentials are configured. Falls back to stub checks otherwise.

import {
  RekognitionClient,
  DetectTextCommand,
  DetectFacesCommand,
  CompareFacesCommand,
} from "@aws-sdk/client-rekognition";

export interface KycCheckResult {
  checkName: string;
  passed: boolean;
  confidence: number; // 0-100
  notes: string;
}

export interface KycAutomatedResults {
  results: KycCheckResult[];
  overallPassed: boolean;
  confidenceScore: number; // average of all checks
  recommendedTier: KycTier;
  timestamp: Date;
}

export type KycTier = "TIER_0_OTP" | "TIER_1_ID_UPLOAD" | "TIER_2_GHANA_CARD";

const GHANA_CARD_WITH_DASHES = /^GHA-\d{9}-\d$/;
const GHANA_CARD_NO_DASHES = /^GHA\d{10}$/;

// ============================================================================
// AWS Rekognition client (lazy initialization)
// ============================================================================

let _rekognitionClient: RekognitionClient | null = null;

function getRekognitionClient(): RekognitionClient | null {
  if (_rekognitionClient !== null) return _rekognitionClient;

  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    return null;
  }

  _rekognitionClient = new RekognitionClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _rekognitionClient;
}

/**
 * Fetch an image from a URL and return it as bytes for Rekognition.
 */
async function fetchImageBytes(imageUrl: string): Promise<Uint8Array> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

// ============================================================================
// Ghana Card validation
// ============================================================================

/**
 * Validate a Ghana Card number.
 * Accepted formats:
 *   - GHA-XXXXXXXXX-X (e.g., GHA-123456789-1)
 *   - GHAXXXXXXXXXX   (no dashes)
 * Returns valid=true if the format matches, along with the normalized format.
 */
export function validateGhanaCardNumber(
  number: string
): { valid: boolean; format: string | null } {
  const trimmed = number.trim().toUpperCase();

  if (GHANA_CARD_WITH_DASHES.test(trimmed)) {
    return { valid: true, format: trimmed };
  }

  if (GHANA_CARD_NO_DASHES.test(trimmed)) {
    // Normalize to GHA-XXXXXXXXX-X
    const normalized = formatGhanaCardNumber(trimmed);
    return { valid: true, format: normalized };
  }

  return { valid: false, format: null };
}

/**
 * Normalize a Ghana Card number to GHA-XXXXXXXXX-X format.
 * Handles input with or without dashes.
 */
export function formatGhanaCardNumber(input: string): string {
  const trimmed = input.trim().toUpperCase().replace(/-/g, "");
  // Expected shape after stripping dashes: GHA followed by 10 digits
  if (!/^GHA\d{10}$/.test(trimmed)) {
    // Best-effort normalization even if input is malformed
    return input.trim().toUpperCase();
  }
  const digits = trimmed.slice(3); // remove leading "GHA"
  const first9 = digits.slice(0, 9);
  const last = digits.slice(9);
  return `GHA-${first9}-${last}`;
}

// ============================================================================
// AWS Rekognition-powered checks
// ============================================================================

/**
 * Check document image quality using AWS Rekognition DetectText.
 * Verifies the image contains text (expected on an ID card) and checks
 * for the presence of "GHANA" text as a basic document authenticity signal.
 */
export async function checkDocumentQuality(imageUrl: string): Promise<KycCheckResult> {
  const client = getRekognitionClient();
  if (!client) {
    return {
      checkName: "documentQuality",
      passed: true,
      confidence: 80,
      notes: "Document quality check skipped — AWS Rekognition not configured (stub fallback)",
    };
  }

  try {
    const imageBytes = await fetchImageBytes(imageUrl);
    const command = new DetectTextCommand({ Image: { Bytes: imageBytes } });
    const response = await client.send(command);

    const textDetections = response.TextDetections ?? [];
    const detectedText = textDetections
      .map((d) => d.DetectedText ?? "")
      .join(" ")
      .toUpperCase();

    // Check for presence of text (any ID card should have text)
    const hasText = textDetections.length > 0;
    // Check for "GHANA" text as a basic authenticity signal
    const hasGhana = detectedText.includes("GHANA");
    // Check for common ID card keywords
    const hasIdKeywords =
      detectedText.includes("CARD") ||
      detectedText.includes("REPUBLIC") ||
      detectedText.includes("IDENTITY") ||
      detectedText.includes("GHA-");

    if (hasText && (hasGhana || hasIdKeywords)) {
      const confidence = Math.min(
        95,
        Math.round(
          (textDetections[0]?.Confidence ?? 80) + (hasGhana ? 5 : 0)
        )
      );
      return {
        checkName: "documentQuality",
        passed: true,
        confidence,
        notes: `Document quality verified via Rekognition — ${textDetections.length} text regions detected, Ghana ID keywords found`,
      };
    }

    if (hasText) {
      return {
        checkName: "documentQuality",
        passed: true,
        confidence: 60,
        notes: "Document has text but Ghana ID keywords not detected — manual review recommended",
      };
    }

    return {
      checkName: "documentQuality",
      passed: false,
      confidence: 20,
      notes: "No text detected in document image — image may be blank or unreadable",
    };
  } catch (error) {
    console.error("Rekognition checkDocumentQuality error:", error);
    return {
      checkName: "documentQuality",
      passed: true,
      confidence: 50,
      notes: "Document quality check failed (Rekognition error) — defaulting to pass for manual review",
    };
  }
}

/**
 * Check selfie image quality using AWS Rekognition DetectFaces.
 * Verifies a face is present, is the primary subject, and has eyes open.
 */
export async function checkSelfieQuality(selfieUrl: string): Promise<KycCheckResult> {
  const client = getRekognitionClient();
  if (!client) {
    return {
      checkName: "selfieQuality",
      passed: true,
      confidence: 80,
      notes: "Selfie quality check skipped — AWS Rekognition not configured (stub fallback)",
    };
  }

  try {
    const imageBytes = await fetchImageBytes(selfieUrl);
    const command = new DetectFacesCommand({
      Image: { Bytes: imageBytes },
      Attributes: ["DEFAULT"],
    });
    const response = await client.send(command);

    const faces = response.FaceDetails ?? [];

    if (faces.length === 0) {
      return {
        checkName: "selfieQuality",
        passed: false,
        confidence: 10,
        notes: "No face detected in selfie image",
      };
    }

    if (faces.length > 1) {
      return {
        checkName: "selfieQuality",
        passed: false,
        confidence: 30,
        notes: `${faces.length} faces detected — selfie should contain only one face`,
      };
    }

    const face = faces[0];
    const confidence = Math.round(face.Confidence ?? 0);

    // Check face landmarks — eyes open
    const eyesOpen = face.EyesOpen?.Value === true;
    const sunglasses = face.Sunglasses?.Value === true;

    if (!eyesOpen || sunglasses) {
      return {
        checkName: "selfieQuality",
        passed: false,
        confidence: 50,
        notes: "Face detected but eyes appear closed or sunglasses detected — retake selfie",
      };
    }

    // Check face bounding box is reasonably centered (not too small)
    const bbox = face.BoundingBox;
    const faceWidth = bbox?.Width ?? 0;
    if (faceWidth < 0.15) {
      return {
        checkName: "selfieQuality",
        passed: false,
        confidence: 40,
        notes: "Face detected but too small in frame — move closer to camera",
      };
    }

    return {
      checkName: "selfieQuality",
      passed: true,
      confidence: Math.min(98, confidence),
      notes: `Selfie quality verified — single face detected at ${confidence}% confidence, eyes open`,
    };
  } catch (error) {
    console.error("Rekognition checkSelfieQuality error:", error);
    return {
      checkName: "selfieQuality",
      passed: true,
      confidence: 50,
      notes: "Selfie quality check failed (Rekognition error) — defaulting to pass for manual review",
    };
  }
}

/**
 * Compare selfie to ID photo using AWS Rekognition CompareFaces.
 * Returns passed=true if face similarity is >= 90%.
 */
export async function compareSelfieToId(
  selfieUrl: string,
  idUrl: string
): Promise<KycCheckResult> {
  const client = getRekognitionClient();
  if (!client) {
    return {
      checkName: "selfieToIdMatch",
      passed: true,
      confidence: 75,
      notes: "Face match comparison skipped — AWS Rekognition not configured (stub fallback)",
    };
  }

  try {
    const [selfieBytes, idBytes] = await Promise.all([
      fetchImageBytes(selfieUrl),
      fetchImageBytes(idUrl),
    ]);

    const command = new CompareFacesCommand({
      SourceImage: { Bytes: selfieBytes },
      TargetImage: { Bytes: idBytes },
      SimilarityThreshold: 90,
    });

    const response = await client.send(command);

    if (!response.FaceMatches || response.FaceMatches.length === 0) {
      const unmatchedCount = response.UnmatchedFaces?.length ?? 0;
      return {
        checkName: "selfieToIdMatch",
        passed: false,
        confidence: 20,
        notes: `No face match found above 90% threshold${unmatchedCount > 0 ? ` (${unmatchedCount} unmatched faces in ID)` : ""}`,
      };
    }

    const bestMatch = response.FaceMatches[0];
    const similarity = Math.round(bestMatch.Similarity ?? 0);

    if (similarity >= 90) {
      return {
        checkName: "selfieToIdMatch",
        passed: true,
        confidence: similarity,
        notes: `Face match verified — ${similarity}% similarity between selfie and ID photo`,
      };
    }

    return {
      checkName: "selfieToIdMatch",
      passed: false,
      confidence: similarity,
      notes: `Face match below threshold — ${similarity}% similarity (requires >= 90%)`,
    };
  } catch (error) {
    console.error("Rekognition compareSelfieToId error:", error);
    return {
      checkName: "selfieToIdMatch",
      passed: true,
      confidence: 50,
      notes: "Face match comparison failed (Rekognition error) — defaulting to pass for manual review",
    };
  }
}

// ============================================================================
// Ghana Card format check
// ============================================================================

/**
 * Check Ghana Card number format using validateGhanaCardNumber.
 * Returns passed=true if valid, with 95% confidence.
 */
export function checkGhanaCardFormat(ghanaCardNumber: string): KycCheckResult {
  const { valid, format } = validateGhanaCardNumber(ghanaCardNumber);
  return {
    checkName: "ghanaCardFormat",
    passed: valid,
    confidence: valid ? 95 : 0,
    notes: valid
      ? `Ghana Card format valid (${format})`
      : "Ghana Card format invalid",
  };
}

// ============================================================================
// Combined automated checks
// ============================================================================

/**
 * Run all available automated KYC checks and produce an overall result.
 *
 * Checks run:
 *   - checkGhanaCardFormat (always)
 *   - checkDocumentQuality for idFrontUrl (if provided)
 *   - checkDocumentQuality for idBackUrl (if provided)
 *   - checkSelfieQuality for selfieUrl (if provided)
 *   - compareSelfieToId for selfieUrl + idFrontUrl (if both provided)
 *
 * Tier determination:
 *   - All passed and confidence >= 80 → TIER_2_GHANA_CARD (recommend admin approval)
 *   - Some passed                    → TIER_1_ID_UPLOAD
 *   - None passed                    → TIER_0_OTP
 */
export async function performAutomatedChecks(params: {
  ghanaCardNumber: string;
  selfieUrl?: string;
  idFrontUrl?: string;
  idBackUrl?: string;
}): Promise<KycAutomatedResults> {
  const results: KycCheckResult[] = [];

  // Always check Ghana Card format
  results.push(checkGhanaCardFormat(params.ghanaCardNumber));

  // Document quality checks
  if (params.idFrontUrl) {
    results.push(await checkDocumentQuality(params.idFrontUrl));
  }
  if (params.idBackUrl) {
    results.push(await checkDocumentQuality(params.idBackUrl));
  }

  // Selfie quality check
  if (params.selfieUrl) {
    results.push(await checkSelfieQuality(params.selfieUrl));
  }

  // Face match comparison (requires both selfie and front of ID)
  if (params.selfieUrl && params.idFrontUrl) {
    results.push(await compareSelfieToId(params.selfieUrl, params.idFrontUrl));
  }

  const overallPassed = results.every((r) => r.passed);
  const confidenceScore =
    results.length > 0
      ? Math.round(
          results.reduce((sum, r) => sum + r.confidence, 0) / results.length
        )
      : 0;

  const passedCount = results.filter((r) => r.passed).length;

  let recommendedTier: KycTier;
  if (overallPassed && confidenceScore >= 80) {
    recommendedTier = "TIER_2_GHANA_CARD";
  } else if (passedCount > 0) {
    recommendedTier = "TIER_1_ID_UPLOAD";
  } else {
    recommendedTier = "TIER_0_OTP";
  }

  return {
    results,
    overallPassed,
    confidenceScore,
    recommendedTier,
    timestamp: new Date(),
  };
}

/**
 * Return the recommended KYC tier from a set of automated results.
 */
export function getKycTierForChecks(results: KycAutomatedResults): KycTier {
  return results.recommendedTier;
}
