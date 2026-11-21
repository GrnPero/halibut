// Halibut: Vitest config for the integration tests, which run against a real
// Postgres + pgvector database (the Laravel equivalent is a phpunit.xml that
// points DB_DATABASE at a separate testing database).
//
// Run with `npm run test:integration`. The tests use halibut_test through
// DATABASE_URL_TEST, never the dev database: the global setup refuses any
// database whose name doesn't end in _test, then applies the migrations.

import "dotenv/config";
import { defineConfig } from "vitest/config";

// Each test and hook talks to Postgres, so allow more than Vitest's 5 s.
const INTEGRATION_TEST_TIMEOUT_MS = 30_000;

export default defineConfig({
  // Resolves the @/*, @tests/* and @generated/* aliases from tsconfig.json.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.integration.test.ts"],
    // The files share one database, so run them one at a time.
    fileParallelism: false,
    testTimeout: INTEGRATION_TEST_TIMEOUT_MS,
    hookTimeout: INTEGRATION_TEST_TIMEOUT_MS,
    globalSetup: ["tests/integration/global-setup.ts"],
    setupFiles: ["tests/integration/setup.ts"],
    // Anything that reads DATABASE_URL during a test gets the test database.
    env: { DATABASE_URL: process.env.DATABASE_URL_TEST ?? "" },
  },
});
