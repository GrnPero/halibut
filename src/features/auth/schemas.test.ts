import { BASE_ERROR_CODES } from "@better-auth/core/error";
import { describe, expect, test } from "vitest";

import { createUserSchema } from "@/features/auth/schemas";
import { messages } from "@/lib/messages";
import { config } from "@/server/config";

const { passwordMinLength, passwordMaxLength } = config.auth;
const rules = messages.account.passwordRules;

// Meets every rule: one of each required kind, padded to the minimum length.
const STRONG_PREFIX = "Aa1!";
const strongPassword = STRONG_PREFIX.padEnd(passwordMinLength, "x");

const validInput = {
  email: "someone@example.test",
  name: "Test User",
  password: strongPassword,
};

// Messages of the rejected input's issues on one field.
function issueMessages(input: unknown, field: string) {
  const result = createUserSchema.safeParse(input);

  if (result.success) return [];

  return result.error.issues
    .filter((issue) => issue.path[0] === field)
    .map((issue) => issue.message);
}

describe("createUserSchema", () => {
  test("accepts valid input", () => {
    expect(createUserSchema.safeParse(validInput).success).toBe(true);
  });

  test("trims and lowercases the email", () => {
    const parsed = createUserSchema.parse({
      ...validInput,
      email: "  Someone@Example.TEST ",
    });

    expect(parsed.email).toBe("someone@example.test");
  });

  test("rejects a malformed email", () => {
    expect(
      issueMessages({ ...validInput, email: "not-an-email" }, "email"),
    ).not.toEqual([]);
  });

  test("rejects an empty name", () => {
    expect(issueMessages({ ...validInput, name: "   " }, "name")).not.toEqual(
      [],
    );
  });

  test("rejects a password shorter than the minimum", () => {
    const password = STRONG_PREFIX.padEnd(passwordMinLength - 1, "x");

    expect(issueMessages({ ...validInput, password }, "password")).toEqual([
      BASE_ERROR_CODES.PASSWORD_TOO_SHORT.message,
    ]);
  });

  test("rejects a password longer than the maximum", () => {
    const password = STRONG_PREFIX.padEnd(passwordMaxLength + 1, "x");

    expect(issueMessages({ ...validInput, password }, "password")).toEqual([
      BASE_ERROR_CODES.PASSWORD_TOO_LONG.message,
    ]);
  });

  test.each([
    ["lowercase", "AAAA1!".padEnd(passwordMinLength, "X"), rules.lowercase],
    ["uppercase", "aaaa1!".padEnd(passwordMinLength, "x"), rules.uppercase],
    ["digit", "Aaaa!".padEnd(passwordMinLength, "x"), rules.digit],
    ["symbol", "Aaaa1".padEnd(passwordMinLength, "x"), rules.symbol],
  ])("rejects a password with no %s", (_rule, password, message) => {
    expect(issueMessages({ ...validInput, password }, "password")).toEqual([
      message,
    ]);
  });

  test("accepts a password with unicode letters and spaces", () => {
    const password = "Ñandú corre 9 ".padEnd(passwordMinLength, "é");

    expect(
      createUserSchema.safeParse({ ...validInput, password }).success,
    ).toBe(true);
  });
});
