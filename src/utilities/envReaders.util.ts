/**
 * Helpers for reading typed values from an optional env record.
 * When `env` is provided, the value is parsed from it (falling back to `hardDefault`).
 * When `env` is undefined, `moduleDefault` is returned directly.
 */

/**
 * Parse a number (integer or float) from the env record.
 * Returns NaN when the raw value is not a valid number.
 */
export function readNumber(
  env: Record<string, string | undefined> | undefined,
  key: string,
  moduleDefault: number,
  hardDefault: number,
): number {
  if (env !== undefined) {
    const raw = env[key];
    if (raw === undefined || raw === "") return hardDefault;
    const parsed = Number(raw);
    if (isNaN(parsed)) return NaN;
    return parsed;
  }
  return moduleDefault;
}

/**
 * Parse an integer from the env record.
 * Returns NaN when the raw value is not a valid integer.
 */
export function readInt(
  env: Record<string, string | undefined> | undefined,
  key: string,
  moduleDefault: number,
  hardDefault: number,
): number {
  if (env !== undefined) {
    const raw = env[key];
    if (raw === undefined || raw === "") return hardDefault;
    const parsed = Number(raw);
    if (!Number.isInteger(parsed)) return NaN;
    return parsed;
  }
  return moduleDefault;
}

/**
 * Read a string value from the env record.
 */
export function readString(
  env: Record<string, string | undefined> | undefined,
  key: string,
  moduleDefault: string,
  hardDefault: string,
): string {
  if (env !== undefined) {
    return env[key] ?? hardDefault;
  }
  return moduleDefault;
}

/**
 * Read a boolean value from the env record.
 * Treats the string "true" as `true`, everything else as `false`.
 */
export function readBool(
  env: Record<string, string | undefined> | undefined,
  key: string,
  moduleDefault: boolean,
  hardDefault: boolean,
): boolean {
  if (env !== undefined) {
    const raw = env[key];
    if (raw === undefined) return hardDefault;
    return raw === "true";
  }
  return moduleDefault;
}
