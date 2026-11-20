# Halibut design doc

|            |                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| Status     | Approved. Planning decisions are made. The repo has the skeleton, schema, seed and docs; no feature code yet (section 13) |
| Date       | 2026-11-17                                                                                                                |
| Owner      | Rodrigo                                                                                                                   |
| Repository | [`GrnPero/halibut`](https://github.com/GrnPero/halibut), public                                                           |
| Scope      | Version 1 (V1)                                                                                                            |

Related files:

- [`prisma/schema.prisma`](../prisma/schema.prisma): the database schema (Prisma 7)
- [`src/server/db/prisma.ts`](../src/server/db/prisma.ts): the shared Prisma client
- [`src/lib/enums.ts`](../src/lib/enums.ts): allowed values for every "kind" column
- [`src/features/evaluation/schemas.ts`](../src/features/evaluation/schemas.ts): the framework evaluation as a Zod schema
- [`prompts/job-evaluation-framework.example.md`](../prompts/job-evaluation-framework.example.md): a sample framework, committed so the app works for anyone who clones the repo
- `prompts/job-evaluation-framework.md`: your real framework and salary numbers. Ignored by git; the seed copies it into the `Framework` table
- [`docs/open-questions.md`](./open-questions.md): backlog and accepted limitations
- [`docs/screen-spec.md`](./screen-spec.md): the screen spec from the iPad sketch

## 1. Summary

Halibut is a personal web app that runs on one computer for one person. It
collects job postings from three sources, ranks them against each resume, and
judges the ones that get opened against the Software Engineering Job Evaluation
Framework. It also replaces the "Applications 2026" Google Sheets tab as the
place applications are tracked.

It has two purposes:

1. Find a good role sooner, with less time spent on job boards.
2. Serve as a portfolio project: a Next.js app with a data pipeline, embeddings
   and LLM evaluation behind it.

## 2. Goals and non-goals

**Goals for V1**

- Pull postings from JSearch, the Larajobs RSS feed and Gmail job alert emails
  into one deduplicated list.
- Show one tab per resume, with jobs ranked by similarity to that resume.
- Evaluate a job against the framework when it is opened, and keep the result.
- Track applications with the same columns as the sheet, with a one-time import
  and a CSV export.
- Filter by distance from a home base (Pomona, Los Angeles, Redlands) and show
  remote jobs.

**Non-goals for V1**

- Hosting. The app runs locally. It does support more than one user and has a
  login (section 4), so a second person can use it.
- Sign-up from the app. Accounts are created from the command line.
- Scraping LinkedIn, Indeed or ZipRecruiter directly.
- Applying to jobs automatically.
- Letting the LLM remove jobs from the list. Rules hide jobs; the LLM only
  annotates them.
- Two-way sync with Google Sheets.
- Fetching while the computer is off.

## 3. Decisions made

| Area          | Decision                                                                                                                                                                                                                 | Why                                                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name          | Halibut                                                                                                                                                                                                                  | A fish with a minimum keep size: keep the good ones, throw the rest back                                                                                            |
| Where it runs | Local only, no hosting                                                                                                                                                                                                   | Removes Vercel and Neon from the stack                                                                                                                              |
| Users         | Multi-user with a login (Better Auth, email and password). Accounts are created from the command line; sign-up is off. Every Halibut table has a `userId`, and users share nothing                                       | So a second person can use it; cheap to add while the tables are empty                                                                                              |
| App           | Next.js 16.4 (App Router, Cache Components on), React 19.3, TypeScript 5, Tailwind 4.3, shadcn/ui                                                                                                                        | The stack to learn and put on a resume. shadcn/ui is not installed yet                                                                                              |
| Server code   | Server Actions and Route Handlers                                                                                                                                                                                        | Standard for the App Router                                                                                                                                         |
| Database      | PostgreSQL with pgvector, in Docker                                                                                                                                                                                      | pgvector ranks jobs by similarity to a resume                                                                                                                       |
| ORM           | Prisma 7.10 with the `pg` driver adapter                                                                                                                                                                                 | Stable, and the API most employers run. The repo's `^7.10.1` version ranges stay below 8, so Prisma 8 (still a release candidate) will not be installed by accident |
| IDs           | UUIDv7 in Postgres's native `uuid` type                                                                                                                                                                                  | Common in TypeScript codebases; time-ordered; lets ingestion link rows before saving                                                                                |
| Enums         | None in the database                                                                                                                                                                                                     | Every "kind" column is text. Allowed values live in `src/lib/enums.ts` and are checked before each write, so adding a value needs no migration                      |
| Coordinates   | Plain `Float` latitude and longitude                                                                                                                                                                                     | Precise enough many times over; no PostGIS                                                                                                                          |
| Job sources   | JSearch, Larajobs RSS, Gmail alert emails                                                                                                                                                                                | The boards themselves have no usable search API (section 5)                                                                                                         |
| Matching      | Embeddings from OpenAI's `text-embedding-3-small` (1,536 numbers each) through the AI SDK's `embed` and `embedMany`, compared at query time                                                                              | Ranks by meaning, cheaply; no stored score because the score depends on the resume. Claude does not offer embeddings, so this is a second provider                  |
| Evaluation    | Claude through the Vercel AI SDK, output checked with Zod                                                                                                                                                                | Structured, storable verdicts                                                                                                                                       |
| Models        | Opus 5.5 (`claude-opus-5-5`) for the evaluation, Haiku 5.5 (`claude-haiku-5-5`) for email parsing and classification                                                                                                     | Spend on the judgment, save on the bulk work                                                                                                                        |
| Resumes       | Several, one tab each, over one shared pool of jobs                                                                                                                                                                      | A job that fits two resumes is still one job                                                                                                                        |
| Fetching      | The Search more button runs every source. A daily scheduler, off by default through the `SCHEDULER_ENABLED` setting in `.env`, runs only the free sources (Larajobs and Gmail). Nothing fetches JSearch unless you click | No always-on machine; JSearch requests are only spent when asked for                                                                                                |
| Applications  | The database is the source of truth; the sheet is imported once and exported one way                                                                                                                                     | Two-way sync is not worth the trouble                                                                                                                               |
| Framework     | Stored in the database (`Framework` table), one row per version, including the salary thresholds. Seeded from a git-ignored file                                                                                         | Keeps the framework and salary targets out of the public repo, versions it automatically, and keeps the thresholds out of code                                      |
| Python        | Deferred to a possible V2                                                                                                                                                                                                | Only needed for direct scraping                                                                                                                                     |
| Budget        | About $25 a month for JSearch, plus LLM and embedding usage                                                                                                                                                              | Agreed up front                                                                                                                                                     |

Removed during schema review, so nobody adds them back by accident: a stored
match score, `distanceMiles`, `closedAt`, `talkingMyselfIn`, `sortOrder`,
`roleCategoryLocked`, and the company career-board fields.

## 4. Architecture

```
                 ┌──────────────────────── one computer ───────────────────────┐
                 │                                                             │
  JSearch API ───┤   ┌───────────────────┐         ┌────────────────────────┐  │
  Larajobs RSS ──┼──▶│ Ingestion function│────────▶│ PostgreSQL + pgvector  │  │
  Gmail label ───┤   │ (shared code)     │         │ (Docker)               │  │
                 │   └───────────────────┘         └────────────────────────┘  │
                 │      ▲             ▲                        ▲               │
                 │      │             │                        │               │
                 │  ┌───┴───────┐  ┌──┴──────────────────┐     │               │
                 │  │ Worker    │  │ Next.js app         │─────┘               │
                 │  │ scheduler │  │ pages, actions, API │──▶ Claude API       │
                 │  │           │  │ "Search more" button│──▶ Embeddings API   │
                 │  └───────────┘  └─────────────────────┘                     │
                 └─────────────────────────────────────────────────────────────┘
```

Two processes run side by side. Today `npm run dev` only runs `next dev`; starting
both together needs a tool such as `concurrently`, which is not installed yet.

- **The Next.js app** serves the pages, runs Server Actions, and calls Claude
  for evaluations.
- **A small worker script** (`worker.ts`) runs the scheduler. It is separate
  because Next.js restarts its server whenever a file is saved in development,
  which would start duplicate schedulers.

Both call the same ingestion function, so there is one code path for fetching
however it is triggered.

### Users and login

- **Accounts.** Better Auth with email and password. Its four tables (`User`,
  `Session`, `Account`, `Verification`) were generated by its CLI
  (`npx auth@latest generate`, version 1.7.25) and are used as generated.
- **No sign-up page.** `emailAndPassword.disableSignUp` is on. Tested: with it
  on, Better Auth's own sign-up call is refused even from server code, so the
  account-creation command has to use Better Auth's internal adapter (create the
  user, then link a `credential` account holding the hashed password). That
  adapter is internal to Better Auth, so check it after upgrades. Signing in
  with the created account was tested and works; a wrong password is rejected.
- **Route protection.** `proxy.ts` (Next.js 16's name for middleware) sends
  anyone without a session cookie to `/login`. Following the Next.js docs, it is
  not the only check: every Server Action and Route Handler calls a
  `verifySession()` helper that returns the signed-in user's ID, and every
  query uses it.
- **Nothing is shared between users.** Each user has their own jobs, companies,
  resumes, framework, search areas, applications and fetch history. Two users
  matching the same posting each get their own copy. That duplicates a little
  data and some embedding calls, which is cheap at this size, and keeps every
  table the same: one `userId`, always filtered.
- **Deleting a user deletes all of their data** (every `userId` link cascades).
- **Gmail, per user.** Each user links their own Google account from inside the
  app, after logging in with email and password (Better Auth's `linkSocial`),
  asking only for read-only Gmail access. Google's tokens are stored in that
  user's row in Better Auth's `Account` table, with `providerId` set to
  `google`. With `account.encryptOAuthTokens: true` in the Better Auth config
  (off by default), Better Auth encrypts the tokens before saving them and
  decrypts them when reading, using `BETTER_AUTH_SECRET` as the key. Its
  `getAccessToken` call returns a working access token and refreshes it when it
  has expired. Changing `BETTER_AUTH_SECRET` makes the stored tokens unreadable,
  so each user would have to link Google again.
- **Google limits personal apps.** A Google Cloud project whose consent screen
  is in Testing status is limited to 100 test users, and in that status refresh
  tokens expire seven days after the user agrees. So in Testing status, each
  user reconnects Gmail about once a week; the app should show a "Reconnect
  Gmail" prompt when the token stops working. Publishing the project to
  Production removes the seven-day limit, but read-only Gmail is a scope Google
  restricts, and what verification a personal, unverified app needs for it has
  not been checked.

## 5. Job sources

**Used in V1**

| Source           | What it provides                                                                                                  | Notes                                                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JSearch API      | Listings that Google for Jobs has indexed from LinkedIn, Indeed, ZipRecruiter, Glassdoor and company career pages | Paid: about $25 for 10,000 requests a month (200 a month free). Each result names its publisher. It returns what Google indexed, not each board's full catalog |
| Larajobs RSS     | Laravel jobs                                                                                                      | Free feed at `larajobs.com/feed`                                                                                                                               |
| Gmail job alerts | Whatever LinkedIn, Indeed and ZipRecruiter email                                                                  | A Gmail filter puts alerts under one label; Halibut reads that label, read-only                                                                                |

**Ruled out**

| Option                                           | Why not                                                                             |
| ------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Indeed API                                       | The public job search API is retired                                                |
| ZipRecruiter API                                 | Partner-only, for posting jobs                                                      |
| LinkedIn API                                     | Partner-only, for posting jobs                                                      |
| Handshake                                        | No public API; aimed at early-career candidates                                     |
| Scraping the big boards                          | Against their terms, heavily blocked, brittle. Revisit as V2 only if V1 misses jobs |
| Company career boards (Greenhouse, Lever, Ashby) | Works one company at a time; pushed to the backlog                                  |

**Limits to plan around**

- An alert email carries a title, company, location and link, but not the
  description. Those jobs start as stubs (`Job.description` is null) and need
  the description filled in before they can be ranked or evaluated (section
  11D).
- Gmail's read-only permission covers the whole mailbox. Reading only the alert
  label is a rule in Halibut's code, not something Google enforces.
- Alert emails are untrusted text. Haiku only extracts jobs from them into a
  fixed Zod shape, and nothing in its output triggers any action beyond
  creating job stubs.

## 6. Ingestion pipeline

Each fetch does this for each source:

1. **Start a run.** Create an `IngestRun` row with status `running`.
2. **Fetch.** Call the source. For Gmail, skip any message whose ID is already
   in `ProcessedEmail`.
3. **Normalize.** Turn each listing into one common shape: title, company,
   location, work mode, salary text, posted date, link.
4. **Match the company.** Lowercase the name and strip punctuation and
   suffixes like "Inc" to get `Company.normalizedName`, then find or create the
   company.
5. **Deduplicate.** Build `Job.fingerprint`, a SHA-256 hash of the normalized
   company, normalized title and city. If a job with that fingerprint exists,
   attach a new `JobSighting` to it and update `Job.lastFoundAt`. Otherwise
   create the job.
6. **Classify once.** For a new job, set `Job.roleCategory` from title rules,
   falling back to Haiku for ambiguous titles. It is never reclassified.
7. **Locate.** If the source gave no coordinates, look up the job's city with
   Google's Geocoding API and store `Job.latitude` and `Job.longitude`. If the
   lookup fails, the job is kept with no distance. Google only allows its
   coordinates to be cached for a limited time (30 days in the version of its
   terms checked; confirm the current wording), so a daily cleanup clears the
   coordinates of jobs first found more than 30 days ago. Those jobs then show
   without a distance.
8. **Parse salary.** Keep the original text in `Job.salaryRaw`, and fill
   `salaryMin`, `salaryMax`, `salaryPeriod` and the annualized figures (hourly
   × 2,080) when it can be parsed.
9. **Apply hard filters.** Set `Job.passedHardFilters` and `Job.filterReasons`.
   Failing jobs are hidden, never deleted.
10. **Embed.** If the job has a description, request its embedding and store it
    in `Job.embedding`.
11. **Finish the run.** Record `fetched`, `inserted` and `duplicates`, and set
    the status to `succeeded`, or to `failed` with the error message.

**How each source identifies a listing** (`JobSighting.externalId`):

| Source       | External ID                                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| JSearch      | The job ID in the result                                                                                       |
| Larajobs RSS | The feed item's `guid`, or its link                                                                            |
| Alert emails | The board's own job ID from the link, after unwrapping tracking redirects; otherwise a hash of the cleaned URL |
| Manual entry | A hash of the pasted URL                                                                                       |
| Sheet import | A hash of company, position and date applied                                                                   |

`source` plus `externalId` is unique, so fetching the same listing again
updates the sighting instead of adding a duplicate.

**Triggers**

- **Search more button** on the Jobs page.
- **Scheduler:** once a day at midnight local time (Pacific), only when
  `SCHEDULER_ENABLED=true` in `.env` (off by default). It fetches the free
  sources, Larajobs and Gmail, never JSearch, because `SCHEDULER_SOURCES` lists
  only those. It only fires if the app is running at midnight; a missed day is
  simply skipped. If Halibut is ever hosted on an always-on machine, adding
  `jsearch` to `SCHEDULER_SOURCES` makes the daily run fetch everything.
- **JSearch** only runs when Search more is clicked, which fetches every
  source.

Starting the app does not fetch anything. A fetch on every startup would spend
JSearch requests without being asked for.

**No overlapping runs.** Before starting, check for an `IngestRun` with status
`running`, and skip if there is one. A run that has been `running` for longer
than a set limit (for example 15 minutes) counts as crashed and is ignored, so
one crash cannot block fetching forever.

## 7. Matching

An embedding model turns a text into a long list of numbers that works like
coordinates for its meaning. Texts about similar things get coordinates that
are close together, even when they share no words.

- Each resume is embedded once (`Resume.embedding`).
- Each job with a description is embedded once (`Job.embedding`).
- The match score is how close the two are, computed when the tab loads. It is
  not stored, because it differs per resume.

Prisma 7 cannot read or write vector columns (they are declared
`Unsupported`), so embeddings are written and compared with raw SQL. This query
was run against Postgres 16 with pgvector:

```sql
SELECT j."id", j."title", 1 - (j."embedding" <=> r."embedding") AS "matchScore"
FROM "Job" j
CROSS JOIN (SELECT "embedding" FROM "Resume" WHERE "id" = $2::uuid) r
WHERE j."userId" = $1::uuid
  AND j."embedding" IS NOT NULL
  AND j."passedHardFilters" IS NOT FALSE
  AND j."dismissedAt" IS NULL
ORDER BY j."embedding" <=> r."embedding"
LIMIT 50;
```

`$1` is the signed-in user's ID and `$2` the resume's. `<=>` is pgvector's
cosine distance, so 1 minus it is the similarity.

**Resume tabs are views of one pool.** Every job lives once in `Job`. Each tab
ranks the same pool against its own resume, so a job that fits two resumes
appears in both tabs as the same row, with the same applied state.

**Similarity is not suitability.** A legacy PHP maintenance job can look very
similar to a Laravel resume. The embedding only orders the list; the framework
evaluation decides whether a job is worth applying to. The score is a ranking
signal, not a grade.

## 8. Framework evaluation

When a job is opened, Halibut asks Claude to evaluate it:

- **Prompt:** the text of the active framework (the newest `Framework` row) as
  the system prompt, and the posting as the user message.
- **Output:** an object matching `jobEvaluationSchema` in `src/features/evaluation/schemas.ts`,
  which follows the framework's required format A to H: executive summary,
  technical alignment, engineering environment, compensation and logistics,
  red flags and unknowns (kept separate), career trajectory, interview
  questions, and the final verdict.
- **Verdicts:** STRONG_APPLY, APPLY, INVESTIGATE or PASS.
- **Facts versus guesses:** each finding is marked confirmed, inferred or
  unknown, as the framework requires.

Rules that live in code, not in the model:

- **Salary tier.** The model only extracts the numbers. `salaryTier()` compares
  the annualized pay against the active framework's three thresholds
  (`salaryIdealMin`, `salaryPreferredMin`, `salaryFloor`) and returns ideal,
  preferred minimum, below target or usually pass, so a low salary cannot be
  argued upward. The numbers are stored in the database, not in code.
- **Validation.** Output that does not match the schema is rejected and not
  saved.

How evaluations are stored:

- Each one is a row in `Evaluation`: the verdict as its own column for sorting,
  and the whole object in `Evaluation.result`.
- They are never edited. Running one again adds a new row, and the newest
  `createdAt` is the current one.
- `Evaluation.frameworkId` points to the exact framework version used.
  An evaluation whose framework is not the newest one is stale, and can be
  re-run.
- `Evaluation.model` records the model ID.

The principle "If I'm already trying to talk myself into it, pass" stays in the
prompt, as part of the framework text. It has no column or output field of its
own.

## 9. Data model

![Halibut database tables](./halibut-schema.png)

Ten Halibut tables, plus Better Auth's four (section 4). `Job` is the center.

| Table            | Holds                                                                | Why it exists                                                                 |
| ---------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `Company`        | One row per employer                                                 | So a company is stored once                                                   |
| `Job`            | One row per posting                                                  | The center of the app                                                         |
| `JobSighting`    | One row per place a job was found                                    | Deduplication across sources                                                  |
| `Resume`         | One row per resume version                                           | Each is a tab; jobs are ranked against it                                     |
| `Evaluation`     | The framework verdict for a job                                      | Saved so it is not paid for twice                                             |
| `Framework`      | Your evaluation framework and salary thresholds, one row per version | Keeps them out of the public repo and versions them; the newest row is active |
| `Application`    | The Applications 2026 sheet tab                                      | Tracking, and the export back to Sheets                                       |
| `SearchArea`     | Home bases for the radius filter                                     | Pomona, Los Angeles, Redlands; editable                                       |
| `IngestRun`      | A log line per fetch                                                 | Shows when a source broke and what each run found                             |
| `ProcessedEmail` | Which alert emails are already handled                               | So no email is processed, or paid for, twice                                  |

Every Halibut table has a `userId` linking it to `User`. Apart from that link,
`SearchArea` and `ProcessedEmail` have no relations to other tables on purpose.

**Framework versions.** `Framework` rows are never edited. Saving a change
creates a new row, and the newest row by `createdAt` is the active framework.
The seed creates the first row from `prompts/job-evaluation-framework.md`, which
starts with the three salary numbers between `---` lines, then the text. If
that file does not exist, it uses the committed example. Running the seed again
only adds a row when the file has changed. Each user has their own framework
versions; the seed creates them for the user named by `SEED_USER_EMAIL`. A settings screen for editing the
framework in the app is not in V1. Because the framework then lives only in your
local database and that ignored file, keep a backup (for example `pg_dump`).

**Conventions**

- **Nulls mean unknown.** Never an empty string.
- **Timestamps.** Tables whose rows change have `createdAt` and `updatedAt`.
  Rows that are written once (`Evaluation`, `ProcessedEmail`, `JobSighting`)
  have only a creation time.
- **Text "kind" columns** and where their allowed values are defined:

| Column                                   | Enum in `src/lib/enums.ts` |
| ---------------------------------------- | -------------------------- |
| `Job.roleCategory`                       | `RoleCategory`             |
| `Job.workMode`                           | `WorkMode`                 |
| `Job.salaryPeriod`                       | `SalaryPeriod`             |
| `Job.employmentType`                     | `EmploymentType`           |
| `JobSighting.source`, `IngestRun.source` | `SourceKind`               |
| `Evaluation.verdict`                     | `Verdict`                  |
| `Application.status`                     | `ApplicationStatus`        |
| `IngestRun.status`                       | `RunStatus`                |

`JobSighting.publisher` is deliberately free text, because it holds whatever
name the source reports.

**Per-user uniqueness.** Values that were unique across the table are now
unique per user: `Company` normalized name, `Job.fingerprint`, a sighting's
source plus external ID, resume labels, search area labels, and Gmail message
IDs. Two users can hold the same values without colliding.

**Rules the application enforces, because the database does not**

- **Filter every query by `userId`.** The database cannot stop a query that
  forgets the filter from returning another user's rows. Every data access goes
  through helpers that take the user ID from `verifySession()`, rather than
  calling Prisma directly from pages.

- **One default resume and one default search area per user.** Nothing in the
  database stops two rows from having `isDefault` set. Setting a new default
  must unset the user's old one in the same transaction.
- **Enum values.** Parse with the Zod enum before every write.
- **Classify once.** `Job.roleCategory` is set when the job is created and not
  touched by later fetches.
- **Hidden, not deleted.** A job that fails the hard filters, or that is
  marked Not interested (`Job.dismissedAt`), stays in the database and is
  left out of every resume tab.
- **"Possibly closed"** is worked out from `Job.lastFoundAt` when the page
  loads. There is no stored column for it.

**Distance** is computed at query time from the selected `SearchArea` with the
haversine formula. Remote jobs and jobs with no known coordinates are kept.
This query was run against Postgres 16:

```sql
SELECT j."title", j."locationRaw", d."miles"
FROM "Job" j
CROSS JOIN (
  SELECT "latitude", "longitude", "radiusMiles"
  FROM "SearchArea" WHERE "id" = $2::uuid
) a
CROSS JOIN LATERAL (
  SELECT 3958.8 * 2 * asin(sqrt(
    power(sin(radians(j."latitude" - a."latitude") / 2), 2) +
    cos(radians(a."latitude")) * cos(radians(j."latitude")) *
    power(sin(radians(j."longitude" - a."longitude") / 2), 2)
  )) AS "miles"
) d
WHERE j."userId" = $1::uuid
  AND (j."workMode" = 'remote'
    OR j."latitude" IS NULL
    OR d."miles" <= a."radiusMiles")
ORDER BY d."miles" NULLS LAST;
```

This is straight-line distance, not driving distance. From Pomona it gives 42.5
miles to Santa Monica and 31.9 to Newport Beach, so both fall inside a 50-mile
radius. The drive is longer than the number suggests.

## 10. Screens

The full spec is in [`screen-spec.md`](./screen-spec.md). This section maps each screen to the
data behind it.

| Screen                                              | Data it reads                                                               | Data it writes                                                                                                            |
| --------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Global nav: logo, Jobs, Applications, Upload Resume | None                                                                        | None                                                                                                                      |
| Jobs (`/`): resume tabs                             | `Resume`, ordered default first, then by label                              | None                                                                                                                      |
| Jobs: ranked list                                   | `Job` with `Company`, ranked by the query in section 7                      | None                                                                                                                      |
| Jobs: Search more                                   | `IngestRun` for progress                                                    | Everything in section 6                                                                                                   |
| Job Detail modal                                    | `Job`, `Company`, `JobSighting` (source and publisher), newest `Evaluation` | `Job.viewedAt`; a new `Evaluation`; an `Application` when marked as applied; `Job.dismissedAt` when marked Not interested |
| Applications (`/applications`)                      | `Application` with `Job` and `Company`                                      | Status and other edits                                                                                                    |
| Applications: Import and Export                     | The sheet's CSV                                                             | `Company`, `Job`, `JobSighting`, `Application`                                                                            |
| Upload Resume modal                                 | None                                                                        | A `Resume` with its text and embedding                                                                                    |

Column mapping for the screens:

- **Job row:** title is `Job.title`; company is `Company.name`; location is
  `Job.locationRaw` and `Job.workMode`; salary is `Job.salaryRaw`; posted date
  is `Job.postedAt`; the match score is computed.
- **Applications table:** applied date is `Application.appliedAt`; status is
  `Application.status`; the link is `Job.originalPostingUrl`. "Last update" is
  assumed to mean `Application.latestWordAt`, the sheet's "Latest word" column.
- **"Resume used"** in the spec's Applications table is dropped, along with
  the resume filter. Applying happens on the employer's site, so Halibut does
  not record which resume was sent.
- **"Primary" resume** in the spec is `Resume.isDefault` in the schema.

Next.js 16 behaviour that affects these screens (from the docs bundled with the
installed version, `node_modules/next/dist/docs/`):

- **Cache Components is on** (`cacheComponents: true` in `next.config.ts`). A
  component that reads from the database on every request must sit inside a
  `<Suspense>` boundary with a fallback, or the development overlay reports a
  blocking route. Do not mark the job list or applications table with
  `"use cache"`, because they must show fresh data.
- **Intercepting routes do not survive a refresh as a modal.** According to the
  docs, opening the job's URL directly or refreshing renders the full route
  instead of the modal. So the Job Detail modal built with intercepting routes
  also needs a real `/jobs/[id]` page. It can reuse the modal's content
  component, so it is not a second design. See section 11D.
- **The repo's `AGENTS.md`** tells coding agents that this Next.js version
  differs from what they were trained on, and to read the bundled docs before
  writing code. Keep it.

## 11. Where the screens and the schema disagree

The screen spec was written after the schema was reviewed, and the two did not
fully line up. 11A and 11D are settled. 11B lists screen details to design as
each build step reaches them; none of them change the schema.

### 11A. Schema changes the screens asked for (settled)

| Screen feature                                        | Outcome                                                                                                        |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Not interested (Job Detail)                           | Added. `Job.dismissedAt` records when a job was dismissed, and dismissed jobs are left out of every resume tab |
| "Resume used" column and resume filter (Applications) | Dropped. Applying happens on the employer's site, so there is nothing to record and no schema change           |

### 11B. Schema features with no screen

Tracked as open questions 5 to 10 in [`screen-spec.md`](./screen-spec.md), to become
backlog tickets. Login is covered.

| Feature                    | In the schema as                                                | What the screens lack                                                                                                    |
| -------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Radius filter              | `SearchArea`                                                    | A way to pick a home base on the Jobs page, and somewhere to add or edit areas                                           |
| Hidden jobs                | `Job.passedHardFilters`, `Job.filterReasons`, `Job.dismissedAt` | A "show hidden" toggle (the only way to undo a Not interested), and the reason shown on the job                          |
| Fetch status               | `IngestRun`                                                     | A "last fetched" line or per-source status near Search more                                                              |
| Jobs without a description | `Job.description` is null                                       | A way to paste the description into the Job Detail modal                                                                 |
| Unread state               | `Job.viewedAt`                                                  | Styling only: unopened jobs shown bold                                                                                   |
| Login                      | `User`, `Session`, `Account`                                    | Covered: the screen spec now has a `/login` page (a ready-made shadcn/ui or Better Auth UI form) and Sign out in the nav |
| Search terms               | `Resume.searchTerms`                                            | The Upload Resume modal has no field for them                                                                            |

Suggested way to cover most of these: a filter bar under the resume tabs on the
Jobs page (home base, remote only, show hidden) with a "last fetched" line
beside Search more, and a small settings page for search areas.

### 11C. The screen spec's open questions

| Question                                              | Answer                                                                                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1. One applications list, or one per resume?          | One list. An application belongs to a job, not to a resume, and no resume is recorded on it                                    |
| 2. Import: permanent or one-time?                     | One-time. Move it off the page header to a settings page or first-run step, and leave Export as the only action                |
| 3. Does a job matching two resumes show in both tabs? | Yes, as the same `Job` row, because tabs are views of one pool. Marking it applied in one tab shows it as applied in the other |
| 4. Is there a "not interested" action?                | Yes. It sets `Job.dismissedAt`, and the job disappears from every tab                                                          |

### 11D. Other decisions (all decided)

| Decision                             | Outcome                                                                                                                                                                                                     | Notes                                                                                                                                                                                                              |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| What Search more fetches             | Decided: every source, for every resume                                                                                                                                                                     | Larajobs and Gmail are not tied to a resume, and one pool is simpler than partial fetches                                                                                                                          |
| When the evaluation runs             | Decided: automatically when a job is opened, after a short pause                                                                                                                                            | The pause stops flipping through jobs with the arrow keys from starting one evaluation per job. A saved evaluation is shown instead of re-running                                                                  |
| What an evaluation is tied to        | Decided: the job                                                                                                                                                                                            | One framework report (sections A to H) per job, not one per resume tab, which would triple the cost. `Evaluation.resumeId` can record which tab was open                                                           |
| Jobs with no description             | Decided: left unranked, listed under the ranked jobs as "needs description"                                                                                                                                 | The app tries to find the description through JSearch by title and company, and the description can be pasted in                                                                                                   |
| Embeddings provider and model        | Decided: OpenAI `text-embedding-3-small` through the AI SDK (`@ai-sdk/openai`). Its vectors have 1,536 numbers, matching the schema                                                                         | Every embedding must come from this one model; switching later means re-embedding every job and resume                                                                                                             |
| Geocoding                            | Decided: Google's Geocoding API, for jobs that arrive with a city name but no coordinates (mostly alert emails)                                                                                             | Needs a billing account on the Google Cloud project, even within the 10,000 free requests a month. See section 6 for Google's limit on storing the results                                                         |
| Hard filter rules                    | Decided: salary only. A job is hidden when the top of its range, annualized, is under the active framework's `salaryFloor`                                                                                  | Older technology is flagged by the evaluation, not hidden, as the framework asks                                                                                                                                   |
| Export formats                       | Decided: CSV only in V1                                                                                                                                                                                     | A CSV can be imported into Google Sheets (File, Import). Exporting straight to Google Sheets is in the backlog for V2                                                                                              |
| Search terms per resume              | Decided: Haiku suggests them from the resume at upload                                                                                                                                                      | They can be edited before saving                                                                                                                                                                                   |
| Gmail alerts with more than one user | Decided: each user links their own Google account, and the tokens are stored encrypted in Better Auth's `Account` table (section 4). No new table                                                           | —                                                                                                                                                                                                                  |
| JSearch with more than one user      | Decided: one shared API key. Every user's searches count against the one plan                                                                                                                               | Watch `IngestRun` counts per user                                                                                                                                                                                  |
| "Possibly closed" threshold          | Decided: 14 days                                                                                                                                                                                            | A job no source has returned in 14 days (by `Job.lastFoundAt`) is labeled "possibly closed"                                                                                                                        |
| How the Job Detail modal is built    | Decided: intercepting routes, plus a full `/jobs/[id]` page that reuses the modal's content                                                                                                                 | Each job gets an address: the back button closes the modal, the Applications table can link to a job, and a refresh keeps you on it                                                                                |
| Scheduler                            | Decided: daily at midnight local time, off by default through `SCHEDULER_ENABLED` in `.env`. Which sources it runs is the `SCHEDULER_SOURCES` setting, set to the free sources (Larajobs and Gmail) for now | If the app is not running at midnight, that day is skipped. If Halibut is ever hosted on an always-on machine, adding `jsearch` to `SCHEDULER_SOURCES` makes the daily run fetch every source, with no code change |

## 12. Application tracking and the sheet

`Application` mirrors the "Applications 2026" tab. Only that tab of the
workbook is in scope.

| Sheet column   | Stored in                   |
| -------------- | --------------------------- |
| Position       | `Job.title`                 |
| Company        | `Company.name`              |
| Industry       | `Company.industry`          |
| Role           | `Job.roleCategory`          |
| Location       | `Job.locationRaw`           |
| Date Posted    | `Job.postedAt`              |
| Salary Range   | `Job.salaryRaw`             |
| Date Applied   | `Application.appliedAt`     |
| Connections?   | `Application.hasConnection` |
| Cover Letter   | `Application.coverLetter`   |
| Résumé upload? | `Application.resumeUpload`  |
| Résumé Form?   | `Application.resumeForm`    |
| Notes          | `Application.notes`         |
| Status         | `Application.status`        |
| Latest word    | `Application.latestWordAt`  |
| contact 1      | `Application.contactName`   |
| SHADE          | `Application.shade`         |

Statuses match the sheet's dropdown word for word: draft, sent, phone call,
interview, rejection, offer, pending. In V1 the status is changed by hand.

**Marking a job as applied** creates an `Application` and copies the posting's
description into `Application.descriptionSnapshot`. Postings disappear, and the
snapshot is what gets re-read when a recruiter calls weeks later.

**The one-time import** has to handle what is actually in the sheet's 65 rows:

- **Dates** come in two styles, `9/2/2026` and `Oct- 10- 2026`, and many are
  blank.
- **Salary** is free text: 48 annual figures, 10 hourly, 7 blank or "?".
- **Role** is "Software Development" on every row. Imported jobs are classified
  from their titles like any other job.
- **Status** is sent on 51 rows, rejection on 13 and pending on 1.
- **Four companies appear more than once,** so one company can have several
  jobs and applications.
- **There are stray empty columns** after SHADE, which the import ignores.

Each imported row becomes a `Company`, a stub `Job`, a `JobSighting` with
source `sheet_import`, and an `Application` with `importedFromSheet` set.

## 13. Repository state and local setup

Describes the repo after the pull request that adds this document (branch
`docs/design-and-schema`, based on commit `a7a008f`).

### In the repo

| Area                      | What is there                                                                                                                                                                                                                                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js                   | 16.4.6, App Router in `src/app/`, with feature code in `src/features/<feature>` and shared server code in `src/server`. `next.config.ts` turns on `cacheComponents` and `partialPrefetching`. `src/app/layout.tsx` and `src/app/page.tsx` are still the create-next-app defaults, including the "Create Next App" title |
| React and TypeScript      | React 19.3.0, TypeScript 5, strict mode. The import alias `@/*` points at `src/`, and `@generated/*` points at `generated/`                                                                                                                                                                                             |
| Styling                   | Tailwind CSS 4.3.3, loaded through the `@tailwindcss/turbopack` loader in `next.config.ts` rather than a PostCSS config                                                                                                                                                                                                 |
| Linting                   | ESLint 9 with `eslint-config-next`                                                                                                                                                                                                                                                                                      |
| Prisma                    | `prisma`, `@prisma/client` and `@prisma/adapter-pg` at 7.10.1, plus `pg` 8.23 and `dotenv`                                                                                                                                                                                                                              |
| Prisma client             | `src/server/db/prisma.ts` creates one client with the `PrismaPg` adapter and reuses it across hot reloads. It imports `server-only`, so client code can't import it. This is the client every server file should import                                                                                                 |
| Prisma config             | `prisma.config.ts` reads `DATABASE_URL`, sets the migrations folder, and runs `prisma/seed.ts` with `tsx` for `prisma db seed`                                                                                                                                                                                          |
| Schema                    | `prisma/schema.prisma` has the ten Halibut models and Better Auth's four. The client is generated to `generated/prisma` at the repo root, which is ignored by git, and imported as `@generated/prisma/client`                                                                                                           |
| Validation and evaluation | `src/lib/enums.ts` and `src/features/evaluation/schemas.ts`, using `zod`                                                                                                                                                                                                                                                |
| Seed                      | `prisma/seed.ts`: three search areas and the first framework version, for the account in `SEED_USER_EMAIL`                                                                                                                                                                                                              |
| Framework                 | `prompts/job-evaluation-framework.example.md` is committed. Your own `prompts/job-evaluation-framework.md` is ignored by git                                                                                                                                                                                            |
| Local database            | `docker-compose.yml` (Postgres 16 with pgvector) and `.env.example`                                                                                                                                                                                                                                                     |
| Docs                      | This document, the schema diagram, `docs/open-questions.md` and `docs/screen-spec.md`                                                                                                                                                                                                                                   |
| Agent instructions        | `AGENTS.md` (Next.js) and Prisma's agent skills in `.agents/`, `.claude/` and `.windsurf/`                                                                                                                                                                                                                              |

### Not in the repo yet

| Item                                                                                                                 | Needed for                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Migrations                                                                                                           | The database                                                                                                                                  |
| `better-auth`, `src/server/auth.ts`, an account-creation command, a login page, `src/proxy.ts` and `verifySession()` | Users and login (section 4)                                                                                                                   |
| The Vercel AI SDK (`ai`), its Anthropic provider, and `@ai-sdk/openai` for embeddings                                | The evaluation, email parsing and matching                                                                                                    |
| shadcn/ui                                                                                                            | The UI components. The repo loads Tailwind through the Turbopack loader, not PostCSS, so check that `shadcn init` works with that setup first |
| `concurrently` and a scheduler library                                                                               | Running the worker next to the app                                                                                                            |
| A Gmail API client, an RSS parser, and PDF and DOCX text extraction                                                  | Gmail alerts, Larajobs, resume uploads                                                                                                        |
| A Google Cloud project with the Gmail and Geocoding APIs turned on, and a billing account for Geocoding              | Gmail alerts and distances                                                                                                                    |

### The repo is public

- **Never commit:** `.env`, the applications CSV, resume files, and your
  real framework. `.gitignore` covers `.env` and
  `prompts/job-evaluation-framework.md`; `.env.example` is allowed through.
- **Handled by design:** your framework text and salary thresholds live in the
  database and in the ignored file. The repo only has the example, and the code
  reads the thresholds from the database.
- **Still visible:** section 12 of this document summarizes your application
  history from the sheet (row counts and statuses, no company names).

### Setup steps

```bash
# 1. Packages
npm install

# 2. Database, then .env (copy .env.example and fill it in)
docker compose up -d

# 3. Your framework: copy it to prompts/job-evaluation-framework.md

# 4. First migration: create it without applying
npx prisma migrate dev --create-only --name init
#    then add this as the first line of the generated migration.sql:
#    CREATE EXTENSION IF NOT EXISTS vector;

# 5. Apply it and generate the client
npx prisma migrate dev
npx prisma generate

# 6. Create your account with the account-creation command (not written yet;
#    see section 4), then set SEED_USER_EMAIL in .env to that email.

# 7. Seed your search areas and first framework version
npx prisma db seed
```

`.env` needs `DATABASE_URL` (with `docker-compose.yml` it is
`postgresql://halibut:halibut@localhost:5432/halibut`), `BETTER_AUTH_SECRET`
(generate one with `npx auth@latest secret`), `BETTER_AUTH_URL`
(`http://localhost:3000`) and `SEED_USER_EMAIL`. `.env.example` lists them and
the API keys.

`npx tsc --noEmit` needs Next.js's route types first. `next dev` and
`next build` create them; outside those, run `npx next typegen`.

## 14. What has been checked

| Check                                                                                                                                                                                                     | Result                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The repo at commit `a7a008f`: installed packages, config files and folder layout                                                                                                                          | Read; section 13 describes it                                                                                                                                                                                                                                |
| This branch in the repo: `prisma validate` and `prisma generate`, `tsc --noEmit` on the whole project (after `next typegen`), and ESLint on the new files                                                 | Pass                                                                                                                                                                                                                                                         |
| `prisma validate` and `prisma generate` on Prisma 7.10.1, with the repo's generator settings                                                                                                              | Pass                                                                                                                                                                                                                                                         |
| `enums.ts`, `schemas.ts` (evaluation) and `seed.ts` compile under TypeScript strict mode                                                                                                                  | Pass                                                                                                                                                                                                                                                         |
| Seed script against Postgres 16, through `prisma db seed`                                                                                                                                                 | Three search areas, no duplicates on re-runs. The framework is read from the example file, then from the private file once it exists; a new version is saved only when the file changes. Refuses to run when the account in `SEED_USER_EMAIL` does not exist |
| Better Auth 1.7.25 against Postgres 16                                                                                                                                                                    | Sign-up is refused while turned off; an account created through the internal adapter can sign in; a wrong password is rejected                                                                                                                               |
| Two users in the same database                                                                                                                                                                            | Both can hold the same company, fingerprint, sighting and search area label; each sees only their own jobs; deleting one user removes all of their data and leaves the other's untouched                                                                     |
| Generated client against Postgres 16 with pgvector 0.6.0: UUIDv7 IDs, text arrays, JSON, date columns, unique fingerprint, unique source plus external ID, cascade delete, the default-resume transaction | Pass                                                                                                                                                                                                                                                         |
| The two SQL queries in sections 7 and 9                                                                                                                                                                   | Pass, with expected rows and distances                                                                                                                                                                                                                       |

**Not checked:**

- **The migration itself.** The test tables were written by hand to match
  Prisma's naming, because Prisma's migration engine could not be downloaded in
  the environment where this was prepared. Step 3 above is the first real run.
- **`docker-compose.yml`** has not been started.
- **Every outside service:** JSearch, Gmail, Claude and the embeddings
  provider. No ingestion or evaluation code exists yet.
- **The app has not been started.** `next dev` and `next build` have not been
  run on this branch.

## 15. Risks and known limits

| Risk                                                  | Effect                                                                                | Handling                                                                                                                                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alert emails have no description                      | Many jobs from the main boards start as stubs that cannot be ranked or evaluated      | Look the job up in JSearch by title and company; allow pasting the description. This is the least proven part of the design, so build the email reader after the JSearch path works |
| Fingerprint misses                                    | "Sr. Software Engineer" and "Senior Software Engineer" at one company become two jobs | Normalize common abbreviations; near-identical embeddings could flag likely duplicates later                                                                                        |
| Two companies with the same name                      | Merged into one `Company` row                                                         | Accepted for V1; see `open-questions.md`                                                                                                                                            |
| JSearch coverage                                      | Only what Google for Jobs indexed                                                     | Track which sources find new jobs through `IngestRun` counts                                                                                                                        |
| Similarity is not suitability                         | A poor job can rank high                                                              | The framework evaluation is the judge                                                                                                                                               |
| Gmail access                                          | Read-only permission covers the whole mailbox                                         | Read only the alert label, in code                                                                                                                                                  |
| Google's seven-day token limit                        | In Testing status, Gmail stops working a week after each user connects                | A "Reconnect Gmail" prompt; or publish the Google project, after checking what verification it needs                                                                                |
| A query without a `userId` filter                     | One user sees another's data                                                          | All data access goes through helpers that take the user from `verifySession()`; test with two users                                                                                 |
| Better Auth's internal adapter                        | The account-creation command uses an internal API that can change between versions    | Re-test account creation after upgrading Better Auth                                                                                                                                |
| LLM cost                                              | One Opus call per job evaluated                                                       | Save every evaluation; evaluate on open, not in bulk                                                                                                                                |
| Prisma 7 and vectors                                  | Embedding reads and writes are raw SQL                                                | Keep them in one small module                                                                                                                                                       |
| Nothing fetches on startup or while the app is closed | The list can be stale when the app is opened                                          | Show when the last fetch ran, next to Search more                                                                                                                                   |
| Resume tabs                                           | Three similar resumes will rank many of the same jobs near the top                    | Expected; they differ most on Python-heavy or Next.js-heavy postings                                                                                                                |

## 16. Build order

Each step leaves a working app. The numbers match the phases of the Shortcut
epic [Halibut - MVP](https://app.shortcut.com/personal-projects-15/epic/161),
which lists one small story per pull request. `docs/ROADMAP.md` mirrors
it.

0. **Design.** This document, the schema, the seed and the libraries.
1. **Repo setup.** Before any feature work: the Claude GitHub app and its
   automated PR review, the move to a feature-based `src/` layout, the working
   rules in `AGENTS.md`, CI, Prettier with a pre-commit hook, and Vitest.
2. **Skeleton.** The first migration (with pgvector), the integration test
   harness, shadcn/ui, and the global layout and nav.
3. **Users and login.** Better Auth, the account-creation command, the login
   page, `proxy.ts`, `verifySession()`, and the data-access helpers that filter
   by user. Early, because every later step needs the signed-in user's ID. This
   comes before any ingestion, because every row needs a `userId` and the seed
   needs an existing account.
4. **Ingestion core and Larajobs.** Normalizers, fingerprints, the salary
   parser, title rules, the ingestion service with `IngestRun` logging and
   sightings, the Larajobs RSS source, a plain job list and the Search more
   button.
5. **JSearch.** The JSearch source and the "last fetched" status.
6. **Resumes and ranking.** The AI SDK layer, the vector module, job
   embeddings, text extraction, the upload modal, tabs and the ranked list.
7. **Job Detail and evaluation.** The page and modal with previous and next,
   `viewedAt`, the framework evaluation, Not interested, and pasting a
   description.
8. **Applications.** Mark as applied, the applications table, the CSV export
   and the sheet import.
9. **Gmail alerts.** Linking Google per user with encrypted tokens, the
   label reader, `ProcessedEmail`, and filling in stub jobs.
10. **Filters and scheduling.** Geocoding, search areas and radius, hard
    filters, the "show hidden" toggle, and the worker with the scheduler.

## 17. Backlog

Later versions and accepted limitations are in
[`open-questions.md`](./open-questions.md): the Python scraping service,
company career boards, fuzzy duplicate detection, multi-office jobs, rejection
detection from email, and the Prisma 8 upgrade.
