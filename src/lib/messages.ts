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
} as const;
