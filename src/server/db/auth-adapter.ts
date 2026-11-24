import "server-only";

import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "./prisma";

/**
 * Better Auth's database adapter, built on the plain (unscoped) Prisma client.
 *
 * Better Auth has to look users up before anyone is signed in, so it can't use
 * the user-scoped client. Building the adapter here keeps the plain client
 * inside `src/server/db/`.
 */
export const authDatabase = prismaAdapter(prisma, {
  provider: "postgresql",
  // Off by default, which makes Better Auth's runWithTransaction run each step
  // on its own; on, a multi-step write rolls back as a whole.
  transaction: true,
});
