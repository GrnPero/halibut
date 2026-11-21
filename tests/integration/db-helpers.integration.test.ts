// Halibut: checks the integration harness itself (test DB guard, helpers).

import { describe, expect, it } from "vitest";

import {
  createTestUser,
  PRISMA_MIGRATIONS_TABLE,
  testPrisma,
  truncateAll,
} from "@tests/helpers/db";
import {
  assertTestDatabaseUrl,
  TEST_DATABASE_SUFFIX,
} from "@tests/helpers/test-database-url";

const TEST_URL = `postgresql://user:pass@localhost:5432/app${TEST_DATABASE_SUFFIX}`;
const DEV_URL = "postgresql://user:pass@localhost:5432/app";

describe("assertTestDatabaseUrl", () => {
  it("returns a URL whose database name ends in the test suffix", () => {
    expect(assertTestDatabaseUrl(TEST_URL)).toBe(TEST_URL);
  });

  it("rejects an unset URL", () => {
    expect(() => assertTestDatabaseUrl(undefined)).toThrow(/DATABASE_URL_TEST/);
    expect(() => assertTestDatabaseUrl("")).toThrow(/DATABASE_URL_TEST/);
  });

  it("rejects a database that isn't a test database", () => {
    expect(() => assertTestDatabaseUrl(DEV_URL)).toThrow(TEST_DATABASE_SUFFIX);
  });
});

describe("createTestUser", () => {
  it("creates a user with a unique made-up email", async () => {
    const first = await createTestUser();
    const second = await createTestUser();

    expect(first.email).not.toBe(second.email);
    expect(first.email).toMatch(/@example\.test$/);
    expect(await testPrisma.user.count()).toBe(2);
  });
});

describe("truncateAll", () => {
  it("empties every table, including rows that reference the user", async () => {
    const user = await createTestUser();
    await testPrisma.searchArea.create({
      data: {
        userId: user.id,
        label: "Test area",
        latitude: 0,
        longitude: 0,
      },
    });

    await truncateAll();

    expect(await testPrisma.user.count()).toBe(0);
    expect(await testPrisma.searchArea.count()).toBe(0);
  });

  it("keeps the migration history", async () => {
    await truncateAll();

    const [{ count }] = await testPrisma.$queryRawUnsafe<[{ count: bigint }]>(
      `SELECT count(*) FROM "${PRISMA_MIGRATIONS_TABLE}"`,
    );
    expect(Number(count)).toBeGreaterThan(0);
  });
});
