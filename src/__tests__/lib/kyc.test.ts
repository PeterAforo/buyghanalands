import {
  validateGhanaCardNumber,
  formatGhanaCardNumber,
  checkGhanaCardFormat,
  performAutomatedChecks,
  getKycTierForChecks,
  checkDocumentQuality,
  checkSelfieQuality,
  compareSelfieToId,
} from '@/lib/kyc';

// Mock AWS Rekognition
jest.mock('@aws-sdk/client-rekognition', () => ({
  RekognitionClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      TextDetections: [{ DetectedText: 'GHA-123456789-1', Confidence: 99 }],
      FaceDetails: [{ Confidence: 95, BoundingBox: { Width: 0.2, Height: 0.3, Left: 0.4, Top: 0.2 } }],
      FaceMatches: [{ Similarity: 92, Face: {} }],
      SourceImageFace: { Confidence: 95 },
      UnmatchedFaces: [],
    }),
  })),
  DetectTextCommand: jest.fn(),
  DetectFacesCommand: jest.fn(),
  CompareFacesCommand: jest.fn(),
}));

describe('KYC Library', () => {
  describe('validateGhanaCardNumber', () => {
    it('should validate "GHA-123456789-1" as valid with correct format', () => {
      const result = validateGhanaCardNumber('GHA-123456789-1');
      expect(result.valid).toBe(true);
      expect(result.format).toBe('GHA-123456789-1');
    });

    it('should validate "GHA1234567891" (no dashes) as valid', () => {
      const result = validateGhanaCardNumber('GHA1234567891');
      expect(result.valid).toBe(true);
      expect(result.format).toBe('GHA-123456789-1');
    });

    it('should validate lowercase input by uppercasing', () => {
      const result = validateGhanaCardNumber('gha-123456789-1');
      expect(result.valid).toBe(true);
      expect(result.format).toBe('GHA-123456789-1');
    });

    it('should return invalid for "invalid"', () => {
      const result = validateGhanaCardNumber('invalid');
      expect(result.valid).toBe(false);
      expect(result.format).toBeNull();
    });

    it('should return invalid for empty string', () => {
      const result = validateGhanaCardNumber('');
      expect(result.valid).toBe(false);
      expect(result.format).toBeNull();
    });

    it('should return invalid for wrong digit count', () => {
      const result = validateGhanaCardNumber('GHA-12345678-1');
      expect(result.valid).toBe(false);
    });
  });

  describe('formatGhanaCardNumber', () => {
    it('should format "gha1234567891" to "GHA-123456789-1"', () => {
      expect(formatGhanaCardNumber('gha1234567891')).toBe('GHA-123456789-1');
    });

    it('should format "GHA-123456789-1" (already formatted) correctly', () => {
      expect(formatGhanaCardNumber('GHA-123456789-1')).toBe('GHA-123456789-1');
    });

    it('should uppercase lowercase input', () => {
      expect(formatGhanaCardNumber('gha-123456789-1')).toBe('GHA-123456789-1');
    });
  });

  describe('checkGhanaCardFormat', () => {
    it('should pass for valid Ghana Card number', () => {
      const result = checkGhanaCardFormat('GHA-123456789-1');
      expect(result.checkName).toBe('ghanaCardFormat');
      expect(result.passed).toBe(true);
    });

    it('should fail for invalid Ghana Card number', () => {
      const result = checkGhanaCardFormat('invalid');
      expect(result.passed).toBe(false);
    });
  });

  describe('checkDocumentQuality', () => {
    it('should return a result with checkName documentQuality', async () => {
      const result = await checkDocumentQuality('https://example.com/id.jpg');
      expect(result.checkName).toBe('documentQuality');
      expect(typeof result.passed).toBe('boolean');
      expect(typeof result.confidence).toBe('number');
    });

    it('should handle AWS Rekognition failures gracefully', async () => {
      // Test with a URL that would cause Rekognition to fail
      const result = await checkDocumentQuality('');
      expect(result.checkName).toBe('documentQuality');
      // Should fall back to manual review, not crash
      expect(typeof result.passed).toBe('boolean');
    });
  });

  describe('checkSelfieQuality', () => {
    it('should return a result with checkName selfieQuality', async () => {
      const result = await checkSelfieQuality('https://example.com/selfie.jpg');
      expect(result.checkName).toBe('selfieQuality');
      expect(typeof result.passed).toBe('boolean');
      expect(typeof result.confidence).toBe('number');
    });

    it('should handle empty URL gracefully', async () => {
      const result = await checkSelfieQuality('');
      expect(result.checkName).toBe('selfieQuality');
      expect(typeof result.passed).toBe('boolean');
    });
  });

  describe('compareSelfieToId', () => {
    it('should return a result with checkName selfieToIdMatch', async () => {
      const result = await compareSelfieToId('https://example.com/selfie.jpg', 'https://example.com/id.jpg');
      expect(result.checkName).toBe('selfieToIdMatch');
      expect(typeof result.passed).toBe('boolean');
      expect(typeof result.confidence).toBe('number');
    });

    it('should handle missing URLs gracefully', async () => {
      const result = await compareSelfieToId('', '');
      expect(result.checkName).toBe('selfieToIdMatch');
      expect(typeof result.passed).toBe('boolean');
    });
  });

  describe('performAutomatedChecks', () => {
    it('should return overallPassed=true for valid ghana card only', async () => {
      const result = await performAutomatedChecks({ ghanaCardNumber: 'GHA-123456789-1' });
      expect(result.overallPassed).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.recommendedTier).toBe('TIER_2_GHANA_CARD');
    });

    it('should return overallPassed=false for invalid ghana card', async () => {
      const result = await performAutomatedChecks({ ghanaCardNumber: 'invalid' });
      expect(result.overallPassed).toBe(false);
      expect(result.recommendedTier).toBe('TIER_0_OTP');
    });

    it('should run all checks when selfieUrl and idFrontUrl are provided', async () => {
      const result = await performAutomatedChecks({
        ghanaCardNumber: 'GHA-123456789-1',
        selfieUrl: 'https://example.com/selfie.jpg',
        idFrontUrl: 'https://example.com/id-front.jpg',
      });

      // ghanaCardFormat + documentQuality (front) + selfieQuality + selfieToIdMatch
      expect(result.results).toHaveLength(4);
      expect(result.overallPassed).toBe(true);
      expect(result.confidenceScore).toBeGreaterThanOrEqual(50);
    });

    it('should run document quality for idBackUrl if provided', async () => {
      const result = await performAutomatedChecks({
        ghanaCardNumber: 'GHA-123456789-1',
        idFrontUrl: 'https://example.com/id-front.jpg',
        idBackUrl: 'https://example.com/id-back.jpg',
      });

      // ghanaCardFormat + documentQuality (front) + documentQuality (back)
      expect(result.results).toHaveLength(3);
    });

    it('should include a timestamp', async () => {
      const result = await performAutomatedChecks({ ghanaCardNumber: 'GHA-123456789-1' });
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should recommend TIER_1_ID_UPLOAD when some checks pass', async () => {
      const result = await performAutomatedChecks({
        ghanaCardNumber: 'invalid',
        selfieUrl: 'https://example.com/selfie.jpg',
      });

      // ghanaCardFormat fails, selfieQuality passes → some passed
      expect(result.overallPassed).toBe(false);
      expect(result.recommendedTier).toBe('TIER_1_ID_UPLOAD');
    });
  });

  describe('getKycTierForChecks', () => {
    it('should return the recommended tier from results', async () => {
      const results = await performAutomatedChecks({ ghanaCardNumber: 'GHA-123456789-1' });
      const tier = getKycTierForChecks(results);
      expect(tier).toBe(results.recommendedTier);
    });

    it('should return TIER_2_GHANA_CARD for all-passed checks', async () => {
      const results = await performAutomatedChecks({
        ghanaCardNumber: 'GHA-123456789-1',
        selfieUrl: 'https://example.com/selfie.jpg',
        idFrontUrl: 'https://example.com/id-front.jpg',
      });
      expect(getKycTierForChecks(results)).toBe('TIER_2_GHANA_CARD');
    });

    it('should return TIER_0_OTP when no checks pass', async () => {
      const results = await performAutomatedChecks({ ghanaCardNumber: 'invalid' });
      expect(getKycTierForChecks(results)).toBe('TIER_0_OTP');
    });
  });
});
