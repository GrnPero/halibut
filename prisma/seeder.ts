// Halibut: the seed steps, callable from prisma/seed.ts and from tests.
//
// Seeds data for one existing user; it does not create users.
//
// 1. Creates the three starting search areas.
// 2. Saves the evaluation framework as a Framework row.
//
// Safe to re-run. A search area that already exists (matched by label) is left
// as it is, and a new Framework row is only created when the file's text or
// salary numbers differ from the newest saved version.

import { readFileSync } from "node:fs";

import type { PrismaClient } from "../generated/prisma/client";

// Approximate city centers. Close enough for a 50-mile radius.
export const SEARCH_AREAS = [
  {
    label: "Pomona",
    latitude: 34.0551,
    longitude: -117.75,
    radiusMiles: 50,
    isDefault: true,
  },
  {
    label: "Los Angeles",
    latitude: 34.0522,
    longitude: -118.2437,
    radiusMiles: 50,
    isDefault: false,
  },
  {
    label: "Redlands",
    latitude: 34.0556,
    longitude: -117.1825,
    radiusMiles: 50,
    isDefault: false,
  },
];

// Your real framework is git-ignored. The example is committed so the app
// still works for anyone who clones the repo.
export const PRIVATE_FRAMEWORK = "prompts/job-evaluation-framework.md";
export const EXAMPLE_FRAMEWORK = "prompts/job-evaluation-framework.example.md";

type FrameworkFile = {
  content: string;
  salaryIdealMin: number;
  salaryPreferredMin: number;
  salaryFloor: number;
};

export type SeedOptions = {
  email: string;
  frameworkPath: string;
};

// The file starts with a block of three numbers between "---" lines, then the
// framework text.
export function readFrameworkFile(path: string): FrameworkFile {
  let raw: string;

  try {
    raw = readFileSync(path, "utf8");
  } catch (error) {
    throw new Error(`Can't read framework file ${path}`, { cause: error });
  }

  if (!raw.trim()) throw new Error(`Framework file ${path} is empty`);

  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

  if (!match)
    throw new Error(`${path} must start with a --- block of salary numbers`);

  const numbers: Record<string, number> = {};

  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^\s*(\w+)\s*:\s*(\d+)\s*$/);

    if (pair) numbers[pair[1]] = Number(pair[2]);
  }

  for (const key of ["salaryIdealMin", "salaryPreferredMin", "salaryFloor"]) {
    if (!(key in numbers)) throw new Error(`${path} is missing ${key}`);
  }

  return {
    content: match[2].trim(),
    salaryIdealMin: numbers.salaryIdealMin,
    salaryPreferredMin: numbers.salaryPreferredMin,
    salaryFloor: numbers.salaryFloor,
  };
}

async function findSeedUser(prisma: PrismaClient, email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user)
    throw new Error(
      `No account for ${email}. Create the account first, then run the seed.`,
    );

  return user;
}

async function seedSearchAreas(prisma: PrismaClient, userId: string) {
  for (const area of SEARCH_AREAS) {
    await prisma.searchArea.upsert({
      where: { userId_label: { userId, label: area.label } },
      update: {},
      create: { ...area, userId },
    });
  }

  console.log(
    `Search areas for this user: ${await prisma.searchArea.count({ where: { userId } })}`,
  );
}

async function seedFramework(
  prisma: PrismaClient,
  userId: string,
  path: string,
) {
  const file = readFrameworkFile(path);

  const latest = await prisma.framework.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const unchanged =
    latest !== null &&
    latest.content === file.content &&
    latest.salaryIdealMin === file.salaryIdealMin &&
    latest.salaryPreferredMin === file.salaryPreferredMin &&
    latest.salaryFloor === file.salaryFloor;

  if (unchanged) {
    console.log(`Framework unchanged (${path})`);

    return;
  }

  await prisma.framework.create({ data: { ...file, userId } });
  console.log(`Saved a new framework version from ${path}`);
}

export async function runSeed(prisma: PrismaClient, options: SeedOptions) {
  // Grab the user based on the email provided in the options
  const user = await findSeedUser(prisma, options.email);

  // Seed the search areas and framework for that user
  await seedSearchAreas(prisma, user.id);
  await seedFramework(prisma, user.id, options.frameworkPath);
}
