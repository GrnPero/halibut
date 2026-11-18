# Halibut

A personal job-search app. Halibut pulls job postings from several sources into one deduplicated list, ranks them against each of your resumes, and asks Claude to judge the jobs you open against your own job evaluation framework. It also replaces a Google Sheets tab as the place applications are tracked.

The name: a halibut has a minimum keep size. Keep the good ones, throw the rest back.

**Status: in development.** The design, database schema and seed are done; no features are built yet. Work is tracked in the Shortcut epic "Halibut - MVP" and in `docs/ROADMAP.md` once that exists. Halibut runs locally only. Nothing is hosted.

## How it works

- **Sources.** The JSearch API (listings Google for Jobs indexed from LinkedIn, Indeed, company sites and more), the Larajobs RSS feed, and job-alert emails read from one Gmail label.
- **Ingestion.** Every listing is normalized, matched to a company, and deduplicated by a fingerprint of company, title and city. A job found by two sources is one job with two sightings.
- **Ranking.** Jobs and resumes are embedded with OpenAI's `text-embedding-3-small`, stored in Postgres with pgvector, and each resume tab ranks the same pool of jobs by cosine similarity.
- **Evaluation.** Opening a job asks Claude (Opus) to evaluate it against your framework. The output is checked against a Zod schema and saved, so each job is paid for once. Salary tiers are decided in code from your thresholds, not by the model.
- **Rules hide, the LLM annotates.** Jobs are hidden by explicit rules (a salary floor, or "Not interested"), never deleted and never removed by the model.

The full design is in [`docs/design.md`](docs/design.md), the screens in [`docs/screen-spec.md`](docs/screen-spec.md), and the backlog in [`docs/open-questions.md`](docs/open-questions.md).

## Stack

Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS 4, shadcn/ui (planned), PostgreSQL 16 with pgvector in Docker, Prisma 7 with the `pg` driver adapter, Better Auth (planned), the Vercel AI SDK with Claude and OpenAI (planned), and Zod.

## Layout

```
app/            Next.js routes (still the create-next-app defaults)
lib/            prisma.ts (shared client), enums.ts, evaluation.ts (Zod)
prisma/         schema.prisma and seed.ts; migrations land here
prompts/        job-evaluation-framework.example.md (your real one is git-ignored)
docs/           design doc, screen spec, open questions, schema diagram
generated/      the generated Prisma client (git-ignored)
```

The code is moving to a feature-based `src/` layout (`src/app`, `src/features/<feature>`, `src/server`), described in the epic's setup phase. This section will change with that move.

## Prerequisites

- Node 22
- Docker (for Postgres with pgvector)
- API keys, as features land: Anthropic (evaluation), OpenAI (embeddings), JSearch (paid job search), and a Google Cloud project for Gmail and geocoding. `.env.example` lists them.

## Run locally

```sh
npm install
cp .env.example .env          # then fill it in; never commit .env
docker compose up -d          # Postgres 16 + pgvector on localhost:5432
```

Copy your evaluation framework to `prompts/job-evaluation-framework.md`. It starts with the three salary numbers between `---` lines, then the framework text (see the example file). It's git-ignored; without it the seed uses the committed example.

First migration (until it's committed to the repo):

```sh
npx prisma migrate dev --create-only --name init
# add this as the first line of the generated migration.sql:
#   CREATE EXTENSION IF NOT EXISTS vector;
npx prisma migrate dev
npx prisma generate
```

Create your account, set `SEED_USER_EMAIL` in `.env` to its email, then seed your search areas and first framework version:

```sh
# account-creation command: not written yet (npm run user:create, planned)
npx prisma db seed
npm run dev                   # http://localhost:3000
```

`npx tsc --noEmit` needs Next.js's route types first: `next dev` and `next build` create them, or run `npx next typegen`.

## Privacy

- **The repo is public.** Never commit `.env`, resume files, the applications CSV, or `prompts/job-evaluation-framework.md`. Your framework and salary thresholds live only in that ignored file and your local database, so back the database up (for example with `pg_dump`).
- Resume text, job postings and alert emails are sent to Anthropic and OpenAI to be evaluated, parsed and embedded.
- Gmail access is read-only. Google's permission covers the whole mailbox; Halibut's code reads only the alert label.
- Google tokens are stored encrypted with `BETTER_AUTH_SECRET`. Changing that secret means linking Google again.
- Every user's data is separate, and deleting a user deletes all of it.
