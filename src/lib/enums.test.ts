import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";
import { z } from "zod";

import * as enums from "@/lib/enums";
import { ApplicationStatus } from "@/lib/enums";

// Plain Zod behavior (an enum accepting its own options, rejecting unlisted or
// re-cased values) is not tested here. These tests check the agreements
// enums.ts has with things outside it: the sheet and the Prisma schema.

describe("ApplicationStatus", () => {
  test("matches the Status dropdown of the Applications sheet, in order", () => {
    // Written out on purpose, as an exception to the no-repeated-literals rule:
    // these values come from the sheet, not from enums.ts, so changing one
    // must be a deliberate edit in both places.
    expect(ApplicationStatus.options).toEqual([
      "draft",
      "sent",
      "phone call",
      "interview",
      "rejection",
      "offer",
      "pending",
    ]);
  });
});

describe("prisma/schema.prisma agrees with enums.ts", () => {
  // Built from the URL string: jsdom replaces the global URL class, which
  // Node's fileURLToPath rejects.
  const SCHEMA_PATH = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../../prisma/schema.prisma",
  );
  const MODEL_LINE = /^model\s+(\w+)\s*\{/;
  // Every enum column ends with a comment like "// WorkMode in enums.ts".
  const ENUM_MARKER = /\/\/\s*(\w+) in enums\.ts/;
  const STRING_DEFAULT = /@default\("([^"]*)"\)/;

  type StringEnum = z.ZodEnum<Record<string, string>>;
  const enumsByName = new Map(
    Object.entries(enums as Record<string, unknown>).filter(
      (entry): entry is [string, StringEnum] => entry[1] instanceof z.ZodEnum,
    ),
  );

  type Column = {
    column: string;
    enumName: string | null;
    defaultValue: string | null;
  };

  // One entry per field line that names an enum or has a string default.
  const columns: Column[] = [];
  let model = "";
  for (const line of readFileSync(SCHEMA_PATH, "utf8").split("\n")) {
    model = line.match(MODEL_LINE)?.[1] ?? model;
    const enumName = line.match(ENUM_MARKER)?.[1] ?? null;
    const defaultValue = line.match(STRING_DEFAULT)?.[1] ?? null;
    if (enumName !== null || defaultValue !== null) {
      const field = line.trim().split(/\s+/)[0];
      columns.push({ column: `${model}.${field}`, enumName, defaultValue });
    }
  }

  const enumColumns = columns.filter(
    (c): c is Column & { enumName: string } => c.enumName !== null,
  );
  const enumDefaults = enumColumns.filter(
    (c): c is Column & { enumName: string; defaultValue: string } =>
      c.defaultValue !== null,
  );

  test("has enum columns to check, so the tests below are not empty", () => {
    expect(enumColumns.length).toBeGreaterThan(0);
  });

  test("every string default is on a column that names its enum", () => {
    const unmarked = columns
      .filter((c) => c.defaultValue !== null && c.enumName === null)
      .map((c) => c.column);

    expect(unmarked).toEqual([]);
  });

  test.each(enumColumns)(
    "$column names $enumName, which enums.ts exports",
    ({ enumName }) => {
      expect([...enumsByName.keys()]).toContain(enumName);
    },
  );

  test.each(enumDefaults)(
    '$column default "$defaultValue" is listed in $enumName',
    ({ enumName, defaultValue }) => {
      expect(enumsByName.get(enumName)?.options).toContain(defaultValue);
    },
  );
});
