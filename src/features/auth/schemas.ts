import { BASE_ERROR_CODES } from "@better-auth/core/error";
import { z } from "zod";

import { messages } from "@/lib/messages";
import { config } from "@/server/config";

const { passwordMinLength, passwordMaxLength } = config.auth;
const { errors, passwordRules } = messages.account;

/**
 * A new account's password: length limits from config, plus one lowercase
 * letter, uppercase letter, digit and symbol. Any character is allowed,
 * including spaces and Unicode, and it is never trimmed.
 */
export const passwordSchema = z
  .string()
  .min(passwordMinLength, BASE_ERROR_CODES.PASSWORD_TOO_SHORT.message)
  .max(passwordMaxLength, BASE_ERROR_CODES.PASSWORD_TOO_LONG.message)
  .regex(/\p{Ll}/u, passwordRules.lowercase)
  .regex(/\p{Lu}/u, passwordRules.uppercase)
  .regex(/\p{Nd}/u, passwordRules.digit)
  .regex(/[^\p{L}\p{Nd}]/u, passwordRules.symbol);

/** Input for creating an account (≈ a Laravel Form Request's rules). */
export const createUserSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email(BASE_ERROR_CODES.INVALID_EMAIL.message)),
  name: z.string().trim().min(1, errors.NAME_REQUIRED),
  password: passwordSchema,
});

/** Validated input for creating an account. */
export type CreateUserInput = z.infer<typeof createUserSchema>;
