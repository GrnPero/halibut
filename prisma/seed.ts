// Halibut: seed data. Run with `npx prisma db seed`.
//
// Seeds data for one existing user, named by SEED_USER_EMAIL in .env. Create
// that account first; the seed does not create users.
//
// 1. Creates the three starting search areas.
// 2. Saves your evaluation framework as the first Framework row.
//
// Safe to re-run. A search area that already exists (matched by label) is left
// as it is, and a new Framework row is only created when the file's text or
// salary numbers differ from the newest saved version.

import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Approximate city centers. Close enough for a 50-mile radius.
const SEARCH_AREAS = [
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
const PRIVATE_FRAMEWORK = "prompts/job-evaluation-framework.md";
const EXAMPLE_FRAMEWORK = "prompts/job-evaluation-framework.example.md";

type FrameworkFile = {
  content: string;
  salaryIdealMin: number;
  salaryPreferredMin: number;
  salaryFloor: number;
};

// The file starts with a block of three numbers between "---" lines, then the
// framework text.
function readFrameworkFile(path: string): FrameworkFile {
  const raw = readFileSync(path, "utf8");
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

async function findSeedUser() {
  const email = process.env.SEED_USER_EMAIL;
  if (!email)
    throw new Error("Set SEED_USER_EMAIL in .env to the account to seed.");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)
    throw new Error(
      `No account for ${email}. Create the account first, then run the seed.`,
    );
  return user;
}

async function seedSearchAreas(userId: string) {
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

async function seedFramework(userId: string) {
  const path = existsSync(PRIVATE_FRAMEWORK)
    ? PRIVATE_FRAMEWORK
    : EXAMPLE_FRAMEWORK;
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

async function main() {
  const user = await findSeedUser();
  await seedSearchAreas(user.id);
  await seedFramework(user.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
