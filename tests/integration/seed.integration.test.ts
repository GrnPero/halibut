// Halibut: prisma/seed.ts is safe to re-run.

import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestUser, testPrisma } from "@tests/helpers/db";

import {
  EXAMPLE_FRAMEWORK,
  readFrameworkFile,
  runSeed,
  SEARCH_AREAS,
} from "../../prisma/seeder";

const MISSING_USER_EMAIL = "nobody@example.test";
const CHANGED_FRAMEWORK_LINE = "An extra line so the framework text differs.";

describe("runSeed", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "halibut-seed-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("creates the search areas and one framework version on the first run", async () => {
    const user = await createTestUser();

    await runSeed(testPrisma, {
      email: user.email,
      frameworkPath: EXAMPLE_FRAMEWORK,
    });

    const areas = await testPrisma.searchArea.findMany({
      where: { userId: user.id },
    });

    expect(areas.map((area) => area.label).sort()).toEqual(
      SEARCH_AREAS.map((area) => area.label).sort(),
    );
    const frameworks = await testPrisma.framework.findMany({
      where: { userId: user.id },
    });

    expect(frameworks).toHaveLength(1);
    expect(frameworks[0]).toMatchObject(readFrameworkFile(EXAMPLE_FRAMEWORK));
  });

  it("adds nothing on a second run", async () => {
    const user = await createTestUser();
    const options = { email: user.email, frameworkPath: EXAMPLE_FRAMEWORK };

    await runSeed(testPrisma, options);
    await runSeed(testPrisma, options);

    expect(await testPrisma.searchArea.count()).toBe(SEARCH_AREAS.length);
    expect(await testPrisma.framework.count()).toBe(1);
  });

  it("adds a framework version when the file changes", async () => {
    const user = await createTestUser();

    await runSeed(testPrisma, {
      email: user.email,
      frameworkPath: EXAMPLE_FRAMEWORK,
    });

    const changedPath = join(tempDir, "framework.md");
    const original = await readFile(EXAMPLE_FRAMEWORK, "utf8");

    await writeFile(changedPath, `${original}\n${CHANGED_FRAMEWORK_LINE}\n`);
    await runSeed(testPrisma, {
      email: user.email,
      frameworkPath: changedPath,
    });

    const frameworks = await testPrisma.framework.findMany({
      where: { userId: user.id },
    });

    expect(frameworks).toHaveLength(2);
    const changed = frameworks.filter((framework) =>
      framework.content.includes(CHANGED_FRAMEWORK_LINE),
    );

    expect(changed).toHaveLength(1);
    expect(await testPrisma.searchArea.count()).toBe(SEARCH_AREAS.length);
  });

  it("refuses to run when the seed user doesn't exist", async () => {
    await expect(
      runSeed(testPrisma, {
        email: MISSING_USER_EMAIL,
        frameworkPath: EXAMPLE_FRAMEWORK,
      }),
    ).rejects.toThrow(/No account/);

    expect(await testPrisma.searchArea.count()).toBe(0);
    expect(await testPrisma.framework.count()).toBe(0);
  });
});
