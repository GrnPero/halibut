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
//
// The steps live in prisma/seeder.ts so the integration tests can call them.
// This file only reads .env, opens the connection and picks the framework file.

import "dotenv/config";
import { existsSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";
import { EXAMPLE_FRAMEWORK, PRIVATE_FRAMEWORK, runSeed } from "./seeder";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_USER_EMAIL;
  if (!email)
    throw new Error("Set SEED_USER_EMAIL in .env to the account to seed.");
  const frameworkPath = existsSync(PRIVATE_FRAMEWORK)
    ? PRIVATE_FRAMEWORK
    : EXAMPLE_FRAMEWORK;
  await runSeed(prisma, { email, frameworkPath });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
