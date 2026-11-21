// Halibut: database helpers for integration tests (≈ Laravel's
// RefreshDatabase trait plus a User factory).
//
// Tests get their own Prisma client on DATABASE_URL_TEST. They never import
// src/server/db/prisma.ts: it is "server-only", and only src/server/db/ may
// use the plain client.

import { randomUUID } from "node:crypto";

import { Prisma, PrismaClient } from "@generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { assertTestDatabaseUrl } from "./test-database-url";

// Prisma's own bookkeeping table. truncateAll() leaves it alone so the applied
// migrations stay recorded.
export const PRISMA_MIGRATIONS_TABLE = "_prisma_migrations";

const adapter = new PrismaPg({
  connectionString: assertTestDatabaseUrl(process.env.DATABASE_URL_TEST),
});

export const testPrisma = new PrismaClient({ adapter });

// A user with a unique made-up email. Pass fields to override the defaults.
export function createTestUser(
  overrides: Partial<Prisma.UserCreateInput> = {},
) {
  return testPrisma.user.create({
    data: {
      name: "Test User",
      email: `test-${randomUUID()}@example.test`,
      ...overrides,
    },
  });
}

// Empties every app table in one statement. CASCADE covers the foreign keys,
// so the order doesn't matter.
export async function truncateAll() {
  const tables = await testPrisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> ${PRISMA_MIGRATIONS_TABLE}
  `;
  if (tables.length === 0) return;
  const list = tables.map(({ tablename }) => `"public"."${tablename}"`);
  await testPrisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${list.join(", ")} RESTART IDENTITY CASCADE`,
  );
}

export function disconnectTestDb() {
  return testPrisma.$disconnect();
}
