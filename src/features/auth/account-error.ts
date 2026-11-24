import type { z } from "zod";

import { messages } from "@/lib/messages";

/** Why an account couldn't be created. */
export type AccountErrorCode =
  | "INVALID_INPUT"
  | "EMAIL_TAKEN"
  | "PASSWORD_TOO_SHORT"
  | "PASSWORD_TOO_LONG"
  | "PASSWORD_TOO_WEAK"
  | "PASSWORD_COMPROMISED"
  | "BREACH_CHECK_FAILED"
  | "DATABASE_ERROR";

/** Options for {@link AccountError}. */
type AccountErrorOptions = {
  /** Extra lines for the user, like the password rules that failed. */
  details?: string[];
  /** The error that caused this one. */
  cause?: unknown;
};

/** An account-creation failure with a code and a message fit to show the user. */
export class AccountError extends Error {
  /** Lines to show under the message, e.g. each password rule that failed. */
  readonly details: string[];

  /**
   * @param code - Why the account couldn't be created.
   * @param message - Text to show the user.
   * @param options - Detail lines and the underlying cause.
   */
  constructor(
    readonly code: AccountErrorCode,
    message: string,
    options: AccountErrorOptions = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "AccountError";
    this.details = options.details ?? [];
  }

  /**
   * Builds one error from a failed `createUserSchema` parse. Length problems
   * win over the composition rules, so a short password isn't also told what
   * it lacks.
   *
   * @param issues - The issues from the failed parse.
   * @returns The error to throw.
   */
  static fromIssues(issues: z.core.$ZodIssue[]): AccountError {
    const password = issues.filter((issue) => issue.path[0] === "password");
    const other = issues.filter((issue) => issue.path[0] !== "password");
    const tooShort = password.find((issue) => issue.code === "too_small");
    const tooLong = password.find((issue) => issue.code === "too_big");

    // The first issue is the message; the rest, if any, are the details.
    if (other.length > 0)
      return new AccountError("INVALID_INPUT", other[0].message, {
        details: other.slice(1).map((issue) => issue.message),
      });

    if (tooShort)
      return new AccountError("PASSWORD_TOO_SHORT", tooShort.message);

    if (tooLong) return new AccountError("PASSWORD_TOO_LONG", tooLong.message);

    return new AccountError(
      "PASSWORD_TOO_WEAK",
      messages.account.errors.PASSWORD_TOO_WEAK,
      {
        details: password
          .filter((issue) => issue.code === "invalid_format")
          .map((issue) => issue.message),
      },
    );
  }
}
