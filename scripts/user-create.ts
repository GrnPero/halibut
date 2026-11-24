// Halibut: creates an account while sign-up is off (≈ an Artisan command).
//
//   npm run user:create -- --email you@example.com --name "Your Name"
//
// Prompts for the password without echoing it; it's never a CLI argument, so
// it stays out of shell history. Piped stdin is read as the password, for
// scripted checks. The logic lives in AccountService; this file only reads
// input and prints the result.

import "dotenv/config";
import { parseArgs } from "node:util";
import { isPasswordCompromised } from "better-auth/plugins/haveibeenpwned";

import { AccountError } from "@/features/auth/account-error";
import { AccountService } from "@/features/auth/server/account.service";
import { messages } from "@/lib/messages";
import { auth } from "@/server/auth";

const CTRL_C = "\u0003";
const BACKSPACE = ["\u007f", "\b"];
const ENTER = ["\r", "\n"];

/**
 * Prompts on the terminal and reads a line without echoing it.
 *
 * @param prompt - Text shown before the input.
 * @returns The typed line.
 */
function readHidden(prompt: string): Promise<string> {
  const { stdin, stdout } = process;

  stdout.write(prompt);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");

  return new Promise((resolve) => {
    let value = "";

    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === CTRL_C) {
          stdout.write("\n");
          process.exit(130);
        }

        if (ENTER.includes(char)) {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          stdout.write("\n");
          resolve(value);

          return;
        }

        if (BACKSPACE.includes(char)) value = [...value].slice(0, -1).join("");
        else value += char;
      }
    };

    stdin.on("data", onData);
  });
}

/**
 * Reads the first line of piped stdin.
 *
 * @returns The line, without its line ending.
 */
async function readPiped(): Promise<string> {
  let input = "";

  for await (const chunk of process.stdin) input += chunk;

  return input.split(/\r?\n/)[0];
}

/**
 * Gets the password: typed twice on a terminal, or one line when piped.
 *
 * @returns The password, or null if the two entries differ.
 */
async function readPassword(): Promise<string | null> {
  if (!process.stdin.isTTY) return readPiped();

  const password = await readHidden(messages.account.passwordPrompt);
  const confirmation = await readHidden(messages.account.confirmPrompt);

  return password === confirmation ? password : null;
}

/**
 * Prints why the account wasn't created.
 *
 * @param error - What createUser threw.
 */
function report(error: unknown) {
  if (!(error instanceof AccountError)) {
    console.error(messages.account.unexpected, error);

    return;
  }

  console.error(error.message);

  for (const line of error.details) console.error(`  - ${line}`);

  if (error.code === "DATABASE_ERROR") {
    console.error(messages.account.databaseHint);

    if (error.cause instanceof Error) console.error(error.cause.message);
  }
}

async function main() {
  const { values } = parseArgs({
    options: { email: { type: "string" }, name: { type: "string" } },
  });

  if (!values.email || !values.name) {
    console.error(messages.account.usage);
    process.exitCode = 1;

    return;
  }

  const password = await readPassword();

  if (password === null) {
    console.error(messages.account.passwordsDiffer);
    process.exitCode = 1;

    return;
  }

  const service = new AccountService(
    await auth.$context,
    isPasswordCompromised,
  );

  try {
    const user = await service.createUser({
      email: values.email,
      name: values.name,
      password,
    });

    console.log(messages.account.created(user.email));
  } catch (error) {
    report(error);
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(messages.account.unexpected, error);
    process.exitCode = 1;
  })
  // Better Auth's Prisma client keeps the process alive; this script can't
  // reach it to disconnect (only src/server/db/ may), so exit explicitly.
  .finally(() => process.exit());
