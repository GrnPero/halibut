<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Halibut

A personal job-search app that runs locally only. It pulls postings from JSearch, the Larajobs RSS feed and Gmail job-alert emails into one deduplicated pool, ranks the pool against each resume, evaluates opened jobs with Claude against the user's framework, and tracks applications. The design is in [`docs/design.md`](docs/design.md), the screens in [`docs/screen-spec.md`](docs/screen-spec.md), the backlog in [`docs/open-questions.md`](docs/open-questions.md), and the planned order in [`docs/ROADMAP.md`](docs/ROADMAP.md).

**Items tagged with a story, like "(sc-169)", don't exist yet.** That story builds them. Until it lands, don't run, import or create them; follow the rule they describe. The story that builds an item removes its tag in the same PR.

## Layout

```
src/
  app/                      routes only: pages, layouts, Server Actions, Route Handlers (thin)
  features/<feature>/
    components/             the feature's React components
    server/*.service.ts     classes with dependencies   ≈ app/Domain/X/Services
    server/queries.ts       the feature's queries       ≈ repository / Eloquent scopes
    schemas.ts              Zod schemas                 ≈ Form Request rules
    *.test.ts               unit tests, next to the file they test
  server/                   shared infrastructure only: db, llm, auth, session, config
  lib/                      shared, framework-free code (enums.ts, messages.ts)
tests/
  setup.ts                  runs before every test file (jest-dom matchers, cleanup)
  helpers/                  shared fakes and fixtures       ≈ factories
prisma/                     schema.prisma, seed.ts, migrations
prompts/                    job-evaluation-framework.example.md (the real one is git-ignored)
generated/                  the generated Prisma client (git-ignored)
```

Import from `src/` with `@/...`, test helpers with `@tests/...`, and the generated Prisma client with `@generated/prisma/client`. Laravel mapping: `src/app/` handlers are thin controllers, and a feature folder is a domain folder.

## Run and check

```sh
docker compose up -d          # Postgres 16 + pgvector on localhost:5432 (container halibut-db)
npx prisma migrate dev        # no migration is committed yet (sc-170); follow the README's first-migration steps
npx prisma db seed
npm run dev                   # http://localhost:3000
npm run build && npm run lint
npm run typecheck             # next typegen && tsc --noEmit
npm test                      # Vitest, once; npm run test:watch reruns on change
npm run format                # Prettier; format:check only lists unformatted files
```

If another Postgres already holds port 5432, Prisma connects to it and fails with errors like `type "vector" does not exist`. Stop that server first; the README has the details.

## Rules

- **Never commit `.env`, resumes, the applications CSV or `prompts/job-evaluation-framework.md`.** The repo is public. Run `git diff --cached --name-only` before every commit. No real personal data in fixtures or anywhere in the repo: no resumes, no sheet rows, no salary thresholds.
- **No magic numbers or strings.** Tunable values go in `src/server/config.ts`, read from env vars with a default. User-facing text goes in `src/lib/messages.ts`. (The first story that needs either file creates it.) Tests import the same constants instead of repeating literals.
- **The user comes from Laravel.** When they bring up a Laravel feature (config, validation, middleware, queues, scheduling, Eloquent, global scopes, lang files, Pest/PHPUnit, …), name the equivalent here, or say plainly that none exists and what the closest option is.

## Architecture

- **`src/app/` stays thin.** Pages, Server Actions and Route Handlers get the scoped client, call a service, and respond. Business logic lives in `src/features/`.
- **Anything with dependencies is a service class** in `src/features/<feature>/server/*.service.ts`, one class per concern, with its dependencies (the scoped Prisma client, a model) passed to the constructor.
- **Stateless steps are plain exported functions** that take their dependencies as arguments.
- **User scoping is automatic.** Feature code uses `getDb()` (sc-177), the user-scoped Prisma client. Like a Laravel global scope (`#[ScopedBy]`) on every model, it adds `userId` to every query, so feature code never writes `userId` itself.
  - Never import the plain `prisma` client (`src/server/db/prisma.ts`) outside `src/server/db/`. A lint rule will enforce this (sc-177); until then, reviewers check it by hand.
  - **Raw SQL skips the scope.** Every function in `src/server/db/vectors.ts` (sc-187) takes `userId` explicitly.
- **Raw vector SQL lives only in `src/server/db/vectors.ts`.** Model calls go only through `src/server/llm/` (sc-186). No provider SDK is imported anywhere else.
- **Files under any `server/` folder start with `import "server-only"`.**
- **No barrel `index.ts` files.** Import from the file that defines the thing.
- **Reuse goes through the owning feature's `server/`.** When a second feature needs something, promote it there (or to `src/server/` if it's infrastructure). Don't copy it.
- **Rules hide jobs; the LLM only annotates them.** Nothing an LLM or an email produces triggers an action beyond creating job stubs. Jobs are hidden by explicit rules (salary floor, Not interested), never deleted, and never removed by the model.
- **JSearch requests are spent only when Search more is clicked.**

## How we work

- **Never push to `main`.** Work on a branch, open a PR with `gh`, and merge only after Rodrigo approves. Opening the PR triggers the Claude review workflow, which posts inline comments.
- **Write the unit tests first, then the feature.** Start with failing tests that describe the behavior, then write the code that makes them pass.
- **Build features in phases. After each phase, stop and let Rodrigo review. Start the next phase only after he says so.** The phases all belong to the same story and PR.
- **Small PRs:** one concern each, with a diff a reviewer can read in a few minutes.
- **PR descriptions follow `.github/pull_request_template.md`.** `gh pr create --body` skips the template, so write the body to a file in the scratchpad from the template and pass it with `--body-file`. Keep every heading, and write "None." under any that don't apply. **Leave every QA checkbox unticked:** they're for the reviewer's manual testing, and a pre-ticked box reads as already tested. Report checks Claude ran in "Additional Notes" as plain text, not checkboxes. End with the Claude Code attribution line.
- **Stories live in Shortcut**, workspace "Personal Projects" (Standard workflow), epic [161](https://app.shortcut.com/personal-projects-15/epic/161) "Halibut - MVP".
  - Put the bracketed tag, e.g. `[sc-170]`, in commit messages and PR bodies. Shortcut only links a PR to a story when it sees the bracketed form. Link stories the PR only partly fixes, or just mentions, by URL without the tag, so the merge doesn't close them.
  - When the PR opens, move the stories it delivers to In Review. After the merge, move them to Done.
  - When docs reference something a later story builds, tag it with that story here and add a "Done when" checkbox to that story to remove the tag.
- **Update `docs/ROADMAP.md` and `docs/design.md` on the branch before the PR.** In the roadmap, mark the delivered stories done with the PR number, add any new stories, and update the "as of" date. When a story is added, closed or moved, update the epic description too. Fix any part of the design doc that no longer matches the code.
- **Whenever work is left uncommitted, end the reply with a ready-to-paste commit command.** Give a one-line summary with the story tags in the first `-m`, and one bullet per change in the second `-m`. Give only the `git commit` command: no `git add` and no `git diff --cached` lines, because Rodrigo stages and checks the files himself:
  ```sh
  git commit -m "Summary of change [sc-170]" -m "- First change
  - Second change"
  ```

## Code review

The Claude review workflow follows this section, and so does Claude when triaging review comments.

### Severity

Every finding's title starts with one circle:

- 🔴 **Blocking:** in normal use, the change crashes, loses or leaks data, opens a security hole, breaks the main flow (fetch jobs, see them ranked, open and evaluate one, track an application), or makes something worse than it is on `main`.
- 🟡 **Minor:** a real bug in the PR's code, but the trigger is unlikely (an upstream outage, odd config) or the impact is small.
- 🟢 **Nit:** style, naming, refactors, extra hardening, defensive checks, tests that could be stronger, and "what if" cases with no realistic trigger.
- 🟣 **Pre-existing:** a bug that's also on `main`, which the PR doesn't make worse.

Weigh how likely it is; the app only runs locally. Exception: these are **always 🔴**, however unlikely the trigger:

- importing the plain Prisma client in feature code
- raw SQL without a `userId` filter
- the private framework, salary thresholds or resume text leaking into the repo or logs
- LLM or email output triggering an action beyond creating job stubs
- spending JSearch requests without a click

### Reviewer limits

- Post every 🔴 finding, and at most 3 🟡/🟢 findings per run in total.
- Post 🟣 only for lines the PR touches.
- Code written to fix an earlier finding only gets a new finding if it's 🔴.

### Triage

This is for Claude in the working session, after the review posts. The reviewer only comments: it never files stories or touches Shortcut.

1. **Verify the finding.** Read the code and check that the failure scenario can really happen. If it's wrong or hallucinated, reply with why, resolve the thread, and file nothing.
2. **Check the circle.** If it's missing or wrong, set it by the rules above and tell Rodrigo.
3. **Act on it:**
   - 🔴: the PR doesn't merge until it's fixed. Fix it in this PR, under the PR's existing stories. No new story.
   - 🟡: list it for Rodrigo with a recommendation. File a To Do story in epic 161 only if he says yes, and link it by URL in the PR's "Related" line, not as a tag. Not fixed in this PR.
   - 🟢: no story. Reply "Nit, not fixing" and resolve the thread.
   - 🟣: search epic 161 for an existing story and link it if there is one. Otherwise propose one, and file it only if Rodrigo says yes. Not fixed in this PR.
   - Each filed story is a `bug` or a `chore`, and includes the problem, the failure scenario, and a fix code snippet.
4. **Stop after two rounds of review fixes.** If a third push still draws a 🔴, ask Rodrigo before fixing it.

## Open work

Shortcut epic [161](https://app.shortcut.com/personal-projects-15/epic/161) is the source of truth, and its description carries the phase list. [`docs/ROADMAP.md`](docs/ROADMAP.md) mirrors it. **What to pick up next:** the first open story in the lowest unfinished phase. When a story is added, closed or moved, update its phase in both places.
