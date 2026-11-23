import "server-only";

import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

import { authDatabase } from "@/server/db/auth-adapter";

/**
 * The Better Auth instance: email and password login with sign-up off, and
 * OAuth tokens encrypted at rest.
 *
 * Better Auth reads `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` from the
 * environment itself. The secret also encrypts stored Google tokens, so
 * changing it means every user links Google again.
 */
export const auth = betterAuth({
  database: authDatabase,
  emailAndPassword: { enabled: true, disableSignUp: true },
  account: { encryptOAuthTokens: true },
  advanced: {
    // Leaves `id` out of inserts so Postgres's gen_random_uuid() fills it;
    // the default would be a base62 string the uuid columns reject.
    database: { generateId: "uuid" },
  },
  // Must stay last: it sets cookies from Server Actions.
  plugins: [nextCookies()],
});
