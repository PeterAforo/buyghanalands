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

    it('should return uppercased input for malformed input', () => {
      expect(formatGhanaCardNumber('invalid')).toBe('INVALID');
    });
  });

  describe('checkGhanaCardFormat', () => {
    it('should return passed=true with 95 confidence for valid card', () => {
      const result = checkGhanaCardFormat('GHA-123456789-1');
      expect(result.checkName).toBe('ghanaCardFormat');
      expect(result.passed).toBe(true);
      expect(result.confidence).toBe(95);
    });

    it('should return passed=false for invalid card', () => {
      const result = checkGhanaCardFormat('invalid');
      expect(result.passed).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.notes).toContain('invalid');
    });
  });

  describe('checkDocumentQuality', () => {
    it('should return a passed result', () => {
      const result = checkDocumentQuality('https://example.com/id.jpg');
      expect(result.checkName).toBe('documentQuality');
      expect(result.passed).toBe(true);
      expect(result.confidence).toBe(80);
    });
  });

  describe('checkSelfieQuality', () => {
    it('should return a passed result', () => {
      const result = checkSelfieQuality('https://example.com/selfie.jpg');
      expect(result.checkName).toBe('selfieQuality');
      expect(result.passed).toBe(true);
      expect(result.confidence).toBe(80);
    });
  });

  describe('compareSelfieToId', () => {
    it('should return a passed result', () => {
      const result = compareSelfieToId('https://example.com/selfie.jpg', 'https://example.com/id.jpg');
      expect(result.checkName).toBe('selfieToIdMatch');
      expect(result.passed).toBe(true);
      expect(result.confidence).toBe(75);
    });
  });

  describe('performAutomatedChecks', () => {
    it('should return overallPassed=true for valid ghana card only', () => {
      const result = performAutomatedChecks({ ghanaCardNumber: 'GHA-123456789-1' });
      expect(result.overallPassed).toBe(true);
      expect(result.confidenceScore).toBe(95);
      expect(result.results).toHaveLength(1);
      expect(result.recommendedTier).toBe('TIER_2_GHANA_CARD');
    });

    it('should return overallPassed=false for invalid ghana card', () => {
      const result = performAutomatedChecks({ ghanaCardNumber: 'invalid' });
      expect(result.overallPassed).toBe(false);
      expect(result.recommendedTier).toBe('TIER_0_OTP');
    });

    it('should run all checks when selfieUrl and idFrontUrl are provided', () => {
      const result = performAutomatedChecks({
        ghanaCardNumber: 'GHA-123456789-1',
        selfieUrl: 'https://example.com/selfie.jpg',
        idFrontUrl: 'https://example.com/id-front.jpg',
      });

      // ghanaCardFormat + documentQuality (front) + selfieQuality + selfieToIdMatch
      expect(result.results).toHaveLength(4);
      expect(result.overallPassed).toBe(true);
      expect(result.confidenceScore).toBeGreaterThanOrEqual(75);
    });

    it('should run document quality for idBackUrl if provided', () => {
      const result = performAutomatedChecks({
        ghanaCardNumber: 'GHA-123456789-1',
        idFrontUrl: 'https://example.com/id-front.jpg',
        idBackUrl: 'https://example.com/id-back.jpg',
      });

      // ghanaCardFormat + documentQuality (front) + documentQuality (back)
      expect(result.results).toHaveLength(3);
    });

    it('should include a timestamp', () => {
      const result = performAutomatedChecks({ ghanaCardNumber: 'GHA-123456789-1' });
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should recommend TIER_1_ID_UPLOAD when some checks pass', () => {
      const result = performAutomatedChecks({
        ghanaCardNumber: 'invalid',
        selfieUrl: 'https://example.com/selfie.jpg',
      });

      // ghanaCardFormat fails, selfieQuality passes → some passed
      expect(result.overallPassed).toBe(false);
      expect(result.recommendedTier).toBe('TIER_1_ID_UPLOAD');
    });
  });

  describe('getKycTierForChecks', () => {
    it('should return the recommended tier from results', () => {
      const results = performAutomatedChecks({ ghanaCardNumber: 'GHA-123456789-1' });
      const tier = getKycTierForChecks(results);
      expect(tier).toBe(results.recommendedTier);
    });

    it('should return TIER_2_GHANA_CARD for all-passed checks', () => {
      const results = performAutomatedChecks({
        ghanaCardNumber: 'GHA-123456789-1',
        selfieUrl: 'https://example.com/selfie.jpg',
        idFrontUrl: 'https://example.com/id-front.jpg',
      });
      expect(getKycTierForChecks(results)).toBe('TIER_2_GHANA_CARD');
    });

    it('should return TIER_0_OTP when no checks pass', () => {
      const results = performAutomatedChecks({ ghanaCardNumber: 'invalid' });
      expect(getKycTierForChecks(results)).toBe('TIER_0_OTP');
    });
  });
});
