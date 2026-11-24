import "server-only";

import { runWithTransaction } from "@better-auth/core/context";
import { BASE_ERROR_CODES } from "@better-auth/core/error";

import { AccountError } from "@/features/auth/account-error";
import { createUserSchema } from "@/features/auth/schemas";
import { messages } from "@/lib/messages";
import type { auth } from "@/server/auth";

/** Better Auth's resolved context: its internal adapter, hasher and database adapter. */
type AuthContext = Awaited<(typeof auth)["$context"]>;

/** Says whether a password appears in a known data breach. */
type BreachChecker = (password: string) => Promise<boolean>;

/**
 * Creates email-and-password accounts while sign-up is off.
 *
 * Better Auth refuses its own sign-up when `disableSignUp` is on, so this uses
 * its internal adapter the way its admin plugin does. The adapter is internal:
 * recheck this class after every Better Auth upgrade.
 */
export class AccountService {
  /**
   * @param authContext - Better Auth's resolved context (`await auth.$context`).
   * @param isPasswordCompromised - Breach check: Better Auth's HIBP lookup in the app, a fake in tests.
   */
  constructor(
    private readonly authContext: AuthContext,
    private readonly isPasswordCompromised: BreachChecker,
  ) {}

  /**
   * Validates the input, checks the password against known breaches, then
   * creates the user and its credential account in one transaction.
   *
   * @param input - Email, name and password, not yet validated.
   * @returns The created user.
   * @throws {AccountError} If the input is invalid, the email is taken, the
   *   password is breached or can't be checked, or the database write fails.
   */
  async createUser(input: { email: string; name: string; password: string }) {
    const parsed = createUserSchema.safeParse(input);

    if (!parsed.success) throw AccountError.fromIssues(parsed.error.issues);

    const { email, name, password } = parsed.data;

    await this.assertNotCompromised(password);

    // Hash before the transaction so it doesn't hold a connection open.
    const hash = await this.authContext.password.hash(password);
    const { adapter, internalAdapter } = this.authContext;

    try {
      return await runWithTransaction(adapter, async () => {
        if (await internalAdapter.findUserByEmail(email))
          throw new AccountError(
            "EMAIL_TAKEN",
            BASE_ERROR_CODES.USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL.message,
          );

        const user = await internalAdapter.createUser(
          { name, email, emailVerified: false },
          { method: "admin" },
        );

        await internalAdapter.linkAccount({
          userId: user.id,
          providerId: "credential",
          accountId: user.id,
          password: hash,
        });

        return user;
      });
    } catch (error) {
      if (error instanceof AccountError) throw error;

      throw new AccountError(
        "DATABASE_ERROR",
        messages.account.errors.DATABASE_ERROR,
        { cause: error },
      );
    }
  }

  /**
   * Fails closed: if the check can't run, no account is created.
   *
   * @param password - The password to look up.
   * @throws {AccountError} If the password is breached or the check fails.
   */
  private async assertNotCompromised(password: string) {
    let compromised: boolean;

    try {
      compromised = await this.isPasswordCompromised(password);
    } catch (error) {
      throw new AccountError(
        "BREACH_CHECK_FAILED",
        messages.account.errors.BREACH_CHECK_FAILED,
        { cause: error },
      );
    }

    if (compromised)
      throw new AccountError(
        "PASSWORD_COMPROMISED",
        messages.account.errors.PASSWORD_COMPROMISED,
      );
  }
}
