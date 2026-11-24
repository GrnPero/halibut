// Halibut: user-facing text, like Laravel's lang files.

/** Every user-facing string in the app, grouped by where it appears. */
export const messages = {
  app: {
    name: "Halibut",
    description:
      "A personal job search: one ranked pool of postings, evaluated and tracked.",
    // Next.js fills %s with the page's own title.
    titleTemplate: "%s · Halibut",
  },
  nav: {
    jobs: "Jobs",
    applications: "Applications",
    uploadResume: "Upload Resume",
    signOut: "Sign out",
  },
  pages: {
    jobs: { title: "Jobs" },
    applications: { title: "Applications" },
  },
  // npm run user:create. Too short, too long, invalid email and email taken
  // reuse Better Auth's own texts (BASE_ERROR_CODES).
  account: {
    usage:
      'Usage: npm run user:create -- --email you@example.com --name "Your Name"',
    passwordPrompt: "Password: ",
    confirmPrompt: "Confirm password: ",
    passwordsDiffer: "The passwords don't match.",
    created: (email: string) => `Created the account for ${email}.`,
    databaseHint: "Is Postgres running? Start it with: npm run db:up",
    unexpected: "Unexpected error:",
    // Not in Better Auth: it has no composition rules.
    passwordRules: {
      lowercase: "at least one lowercase letter",
      uppercase: "at least one uppercase letter",
      digit: "at least one digit",
      symbol: "at least one symbol (anything that isn't a letter or digit)",
    },
    errors: {
      NAME_REQUIRED: "Enter a name.",
      PASSWORD_TOO_WEAK: "The password needs:",
      PASSWORD_COMPROMISED:
        "That password appears in a known data breach. Choose another.",
      BREACH_CHECK_FAILED:
        "Couldn't check the password against known breaches, so no account was created. Try again.",
      DATABASE_ERROR: "Couldn't save the account.",
    },
  },
} as const;
