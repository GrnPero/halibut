import "server-only";

// Halibut: tunable values, read from env vars with defaults (≈ Laravel's config/).

/**
 * Reads a positive integer from an env var, or returns the default when unset.
 *
 * @param name - The env var to read.
 * @param fallback - The value when the env var is unset or empty.
 * @returns The parsed integer.
 * @throws If the env var is set but isn't a positive integer.
 */
function positiveIntFromEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();

  if (!raw) return fallback;

  const value = Number(raw);

  if (!Number.isSafeInteger(value) || value <= 0)
    throw new Error(`${name} must be a positive integer, got "${raw}"`);

  return value;
}

/** Every tunable value in the app, grouped by area. */
export const config = {
  auth: {
    // NIST SP 800-63B-4's minimum when a password is the only factor.
    passwordMinLength: positiveIntFromEnv("PASSWORD_MIN_LENGTH", 15),
    // Better Auth's default maximum.
    passwordMaxLength: positiveIntFromEnv("PASSWORD_MAX_LENGTH", 128),
  },
} as const;
