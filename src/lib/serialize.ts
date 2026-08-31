/**
 * Serialization utility for safely passing Prisma objects to JSON responses
 * and Client Components.
 *
 * Recursively converts:
 *   - BigInt   → string
 *   - Decimal  → string (preserves precision)
 *   - Date     → ISO string
 *   - Uint8Array → base64 string
 *
 * Usage:
 *   const data = serializeForJson(await prisma.listing.findMany(...));
 *   return NextResponse.json(data);
 *
 * Or for single values:
 *   return NextResponse.json(serializeForJson(record));
 */

// Prisma.Decimal has a `toFixed()` method but isn't a global type.
// We detect it duck-typed via `$obj` or constructor name.
function isPrismaDecimal(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  const v = value as { $obj?: unknown; fixed?: unknown; toString?: unknown };
  return (
    typeof v === "object" &&
    typeof v.toString === "function" &&
    (v.constructor?.name === "Decimal" || "$obj" in v || "fixed" in v)
  );
}

function isDate(value: unknown): boolean {
  return value instanceof Date;
}

function isBigInt(value: unknown): boolean {
  return typeof value === "bigint";
}

function isUint8Array(value: unknown): boolean {
  return value instanceof Uint8Array;
}

/**
 * Recursively transform a value so it is safe to pass to `JSON.stringify`,
 * `NextResponse.json()`, or as a prop from a Server Component to a Client Component.
 */
export function serializeForJson<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }

  if (isBigInt(value)) {
    return (value as unknown as bigint).toString() as unknown as T;
  }

  if (isPrismaDecimal(value)) {
    return (value as unknown as { toString(): string }).toString() as unknown as T;
  }

  if (isDate(value)) {
    return (value as unknown as Date).toISOString() as unknown as T;
  }

  if (isUint8Array(value)) {
    return Buffer.from(value as unknown as Uint8Array).toString("base64") as unknown as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeForJson(item)) as unknown as T;
  }

  if (typeof value === "object" && value !== null) {
    // Don't try to serialize class instances that aren't plain objects
    // (e.g., Prisma client instances, Request objects, etc.)
    const proto = Object.getPrototypeOf(value);
    if (proto !== null && proto !== Object.prototype && proto.constructor !== Object) {
      // If it has a toJSON method, use it
      if (typeof (value as { toJSON?: () => unknown }).toJSON === "function") {
        return serializeForJson((value as unknown as { toJSON: () => unknown }).toJSON()) as T;
      }
      // Otherwise leave as-is (might be a Map, Set, or custom class)
      return value;
    }

    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = serializeForJson(val);
    }
    return result as unknown as T;
  }

  return value;
}

/**
 * Serialize a single Decimal value to a string.
 * Returns null if the value is null/undefined.
 */
export function decimalToString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (isPrismaDecimal(value)) return (value as { toString(): string }).toString();
  if (typeof value === "number") return value.toString();
  if (typeof value === "string") return value;
  return String(value);
}

/**
 * Serialize a single BigInt value to a string.
 * Returns null if the value is null/undefined.
 */
export function bigIntToString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (isBigInt(value)) return (value as bigint).toString();
  if (typeof value === "number") return value.toString();
  if (typeof value === "string") return value;
  return String(value);
}

/**
 * Convert a Decimal to a number (use only when precision loss is acceptable,
 * e.g., for coordinates).
 */
export function decimalToNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (isPrismaDecimal(value)) return Number((value as { toString(): string }).toString());
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return Number(value);
}
