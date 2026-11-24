// Halibut: account creation (npm run user:create). The account can sign in,
// and every refusal or failure leaves the database empty.

import { APIError } from "better-auth/api";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AccountError,
  AccountService,
} from "@/features/auth/server/account.service";
import { messages } from "@/lib/messages";
import { auth } from "@/server/auth";
import { config } from "@/server/config";
import { testPrisma } from "@tests/helpers/db";

// Made-up account details. The password meets every rule.
const ACCOUNT = {
  name: "Test User",
  email: "account@example.test",
  password: "Aa1!".padEnd(config.auth.passwordMinLength, "x"),
};

const notCompromised = async () => false;

// The service with a fake breach checker, so no test calls the network.
async function makeService(isPasswordCompromised = notCompromised) {
  return new AccountService(await auth.$context, isPasswordCompromised);
}

// Runs createUser and returns the AccountError it throws.
async function createUserError(service: AccountService, input: typeof ACCOUNT) {
  const error = await service.createUser(input).catch((caught) => caught);

  expect(error).toBeInstanceOf(AccountError);

  return error as AccountError;
}

async function expectNothingCreated() {
  expect(await testPrisma.user.count()).toBe(0);
  expect(await testPrisma.account.count()).toBe(0);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AccountService.createUser", () => {
  it("creates an account that can sign in with its password", async () => {
    const service = await makeService();

    await service.createUser(ACCOUNT);

    const signIn = await auth.api.signInEmail({
      body: { email: ACCOUNT.email, password: ACCOUNT.password },
    });

    expect(signIn.token).toBeTruthy();
  });

  it("rejects a sign-in with the wrong password", async () => {
    const service = await makeService();

    await service.createUser(ACCOUNT);

    await expect(
      auth.api.signInEmail({
        body: { email: ACCOUNT.email, password: `${ACCOUNT.password}-wrong` },
      }),
    ).rejects.toBeInstanceOf(APIError);
  });

  it("refuses an email that is already taken, in any case", async () => {
    const service = await makeService();

    await service.createUser(ACCOUNT);

    const error = await createUserError(service, {
      ...ACCOUNT,
      email: ACCOUNT.email.toUpperCase(),
    });

    expect(error.code).toBe("EMAIL_TAKEN");
    expect(await testPrisma.user.count()).toBe(1);
    expect(await testPrisma.account.count()).toBe(1);
  });

  it("refuses a password that is too short", async () => {
    const service = await makeService();

    const error = await createUserError(service, {
      ...ACCOUNT,
      password: "Aa1!",
    });

    expect(error.code).toBe("PASSWORD_TOO_SHORT");
    await expectNothingCreated();
  });

  it("refuses a weak password and lists the rules it breaks", async () => {
    const service = await makeService();

    const error = await createUserError(service, {
      ...ACCOUNT,
      password: "x".repeat(config.auth.passwordMinLength),
    });

    const rules = messages.account.passwordRules;

    expect(error.code).toBe("PASSWORD_TOO_WEAK");
    expect(error.details).toEqual([rules.uppercase, rules.digit, rules.symbol]);
    await expectNothingCreated();
  });

  it("refuses a password found in a breach", async () => {
    const service = await makeService(async () => true);

    const error = await createUserError(service, ACCOUNT);

    expect(error.code).toBe("PASSWORD_COMPROMISED");
    await expectNothingCreated();
  });

  it("fails closed when the breach check can't run", async () => {
    const service = await makeService(async () => {
      throw new Error("network down");
    });

    const error = await createUserError(service, ACCOUNT);

    expect(error.code).toBe("BREACH_CHECK_FAILED");
    await expectNothingCreated();
  });

  it("reports a database failure and creates nothing", async () => {
    const { internalAdapter } = await auth.$context;
    const failure = new Error("connection lost");

    vi.spyOn(internalAdapter, "createUser").mockRejectedValueOnce(failure);

    const error = await createUserError(await makeService(), ACCOUNT);

    expect(error.code).toBe("DATABASE_ERROR");
    expect(error.cause).toBe(failure);
    await expectNothingCreated();
  });

  it("rolls the user back when linking the password fails", async () => {
    const { internalAdapter } = await auth.$context;

    vi.spyOn(internalAdapter, "linkAccount").mockRejectedValueOnce(
      new Error("insert failed"),
    );

    const error = await createUserError(await makeService(), ACCOUNT);

    expect(error.code).toBe("DATABASE_ERROR");
    await expectNothingCreated();
  });
});
