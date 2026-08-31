import {
  serializeForJson,
  decimalToString,
  bigIntToString,
  decimalToNumber,
} from '@/lib/serialize';

describe('serializeForJson', () => {
  it('should pass through null and undefined', () => {
    expect(serializeForJson(null)).toBeNull();
    expect(serializeForJson(undefined)).toBeUndefined();
  });

  it('should pass through primitives', () => {
    expect(serializeForJson(42)).toBe(42);
    expect(serializeForJson('hello')).toBe('hello');
    expect(serializeForJson(true)).toBe(true);
  });

  it('should convert BigInt to string', () => {
    const bigVal = BigInt('12345678901234567890');
    const result = serializeForJson(bigVal);
    expect(result).toBe('12345678901234567890');
    expect(typeof result).toBe('string');
  });

  it('should convert Date to ISO string', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const result = serializeForJson(date);
    expect(result).toBe('2024-01-15T10:30:00.000Z');
  });

  it('should serialize arrays recursively', () => {
    const data = [BigInt(1), BigInt(2), new Date('2024-01-01T00:00:00Z')];
    const result = serializeForJson(data);
    expect(result).toEqual(['1', '2', '2024-01-01T00:00:00.000Z']);
  });

  it('should serialize nested objects', () => {
    const data = {
      id: 'abc',
      price: BigInt(1000),
      location: {
        lat: BigInt(6),
        lng: BigInt(-1),
      },
      createdAt: new Date('2024-01-01T00:00:00Z'),
    };
    const result = serializeForJson(data) as any;
    expect(result.id).toBe('abc');
    expect(result.price).toBe('1000');
    expect(result.location.lat).toBe('6');
    expect(result.location.lng).toBe('-1');
    expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z');
  });

  it('should handle arrays of objects with BigInt', () => {
    const data = [
      { id: '1', amount: BigInt(100) },
      { id: '2', amount: BigInt(200) },
    ];
    const result = serializeForJson(data) as any[];
    expect(result[0].amount).toBe('100');
    expect(result[1].amount).toBe('200');
  });

  it('should be safe for JSON.stringify', () => {
    const data = { price: BigInt(500), date: new Date('2024-06-01T12:00:00Z') };
    const serialized = serializeForJson(data);
    expect(() => JSON.stringify(serialized)).not.toThrow();
  });
});

describe('decimalToString', () => {
  it('should return null for null/undefined', () => {
    expect(decimalToString(null)).toBeNull();
    expect(decimalToString(undefined)).toBeNull();
  });

  it('should convert number to string', () => {
    expect(decimalToString(42.5)).toBe('42.5');
  });

  it('should pass through string', () => {
    expect(decimalToString('99.9')).toBe('99.9');
  });
});

describe('bigIntToString', () => {
  it('should return null for null/undefined', () => {
    expect(bigIntToString(null)).toBeNull();
    expect(bigIntToString(undefined)).toBeNull();
  });

  it('should convert BigInt to string', () => {
    expect(bigIntToString(BigInt(123))).toBe('123');
  });

  it('should convert number to string', () => {
    expect(bigIntToString(456)).toBe('456');
  });
});

describe('decimalToNumber', () => {
  it('should return null for null/undefined', () => {
    expect(decimalToNumber(null)).toBeNull();
    expect(decimalToNumber(undefined)).toBeNull();
  });

  it('should convert number to number', () => {
    expect(decimalToNumber(42.5)).toBe(42.5);
  });

  it('should convert string to number', () => {
    expect(decimalToNumber('99.9')).toBe(99.9);
  });
});
