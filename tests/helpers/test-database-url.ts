// Halibut: the guard that keeps integration tests off the dev database.
// Kept apart from db.ts so the global setup can use it without opening a
// Prisma connection.

// Integration tests truncate every table, so they only run against a database
// whose name ends with this.
export const TEST_DATABASE_SUFFIX = "_test";

export function assertTestDatabaseUrl(url: string | undefined): string {
  if (!url)
    throw new Error(
      "Set DATABASE_URL_TEST in .env to the test database (see .env.example).",
    );

  const databaseName = new URL(url).pathname.slice(1);

  if (!databaseName.endsWith(TEST_DATABASE_SUFFIX))
    throw new Error(
      `DATABASE_URL_TEST points at "${databaseName}". Integration tests wipe ` +
        `the database, so its name must end in "${TEST_DATABASE_SUFFIX}".`,
    );

  return url;
}
