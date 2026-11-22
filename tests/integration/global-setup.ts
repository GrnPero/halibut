// Halibut: runs once before the integration suite. Checks that
// DATABASE_URL_TEST names a test database, then applies any migrations it
// hasn't seen yet.
//
// This uses `prisma migrate deploy`, not `migrate reset`: deploy never drops
// anything, and truncateAll() empties the tables before each test anyway. If a
// migration that was already applied gets edited, drop halibut_test once (see
// the README) and the next run rebuilds it.

import { execFileSync } from "node:child_process";

import { assertTestDatabaseUrl } from "../helpers/test-database-url";

export default function setup() {
  const url = assertTestDatabaseUrl(process.env.DATABASE_URL_TEST);

  // prisma.config.ts reads DATABASE_URL; dotenv doesn't override a variable
  // that is already set, so the child process sees the test database.
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "inherit",
  });
}
