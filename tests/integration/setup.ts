// Halibut: runs before every integration test file. Each test starts with
// empty tables.

import { afterAll, beforeEach } from "vitest";

import { disconnectTestDb, truncateAll } from "@tests/helpers/db";

beforeEach(async () => {
  await truncateAll();
});

afterAll(async () => {
  await disconnectTestDb();
});
