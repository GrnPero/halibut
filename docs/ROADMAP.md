# Halibut roadmap

As of 2026-11-19. Shortcut epic [161](https://app.shortcut.com/personal-projects-15/epic/161) "Halibut - MVP" is the source of truth, and its description carries the same phase list. This file is the summary and the planned order.

## Phases

Pick up the first open story in the lowest unfinished phase. Inside a phase, work top to bottom; "after sc-…" marks a story that must wait for another, and "either order" marks stories that can go in any order.

### 0. Design

- [x] sc-162: commit the approved design doc, schema, seed and libs (PR #1)

### 1. Repo setup

Before any feature work.

- [x] sc-163: GitHub app + secret (Rodrigo, manual)
- [x] sc-164: move to `src/` (PR #2)
- [ ] sc-165: `AGENTS.md` rules + this roadmap, after sc-164
- [ ] sc-166: Claude review workflow + PR template, after sc-165 and sc-163
- [ ] sc-167: CI (lint, typecheck, build)
- [ ] sc-168: Prettier + Husky + format check, after sc-167
- [ ] sc-169: Vitest in CI, after sc-168

### 2. Skeleton

- [ ] sc-170: first migration (pgvector)
- [ ] sc-171: integration test harness, after sc-170
- [ ] sc-172: shadcn/ui install
- [ ] sc-173: global layout, nav, route groups, after sc-172

### 3. Users and login

- [ ] sc-174: Better Auth config
- [ ] sc-175: `user:create` command, after sc-174
- [ ] sc-176: login page + Sign out, after sc-175
- [ ] sc-177: `proxy.ts`, `verifySession()`, user-scoped Prisma client (global scope), after sc-176

### 4. Ingestion core + Larajobs

- [ ] sc-178: normalizers + fingerprint (either order with sc-179, sc-180)
- [ ] sc-179: salary parser
- [ ] sc-180: role-category rules
- [ ] sc-181: IngestionService, after sc-178, sc-179 and sc-180
- [ ] sc-182: Larajobs RSS, after sc-181
- [ ] sc-183: plain job list + Search more, after sc-182

### 5. JSearch

- [ ] sc-184: JSearch source (either order with sc-185)
- [ ] sc-185: "Last fetched" status

### 6. Resumes and ranking

- [ ] sc-186: LLM layer (Vercel AI SDK) (either order with sc-187)
- [ ] sc-187: vector module
- [ ] sc-188: embed jobs + backfill, after sc-186 and sc-187
- [ ] sc-189: resume text extraction
- [ ] sc-190: Upload Resume modal, after sc-189
- [ ] sc-191: suggested search terms, after sc-190
- [ ] sc-192: resume tabs + ranked list, after sc-188 and sc-190
- [ ] sc-193: "needs description" section, after sc-192
- [ ] sc-194: Haiku fallback for ambiguous titles, after sc-186

### 7. Job Detail and evaluation

- [ ] sc-195: `/jobs/[id]` page
- [ ] sc-196: intercepting-route modal, after sc-195
- [ ] sc-197: prev/next + keys, after sc-196
- [ ] sc-198: `salaryTier()`
- [ ] sc-199: EvaluationService, after sc-198
- [ ] sc-200: auto-evaluate on open + A–H view, after sc-199 and sc-197
- [ ] sc-201: Not interested, after sc-196 (either order with sc-202)
- [ ] sc-202: paste a description, after sc-196

### 8. Applications

- [ ] sc-203: mark as applied
- [ ] sc-204: Applications table, after sc-203
- [ ] sc-205: CSV export, after sc-204
- [ ] sc-206: sheet-import parsers
- [ ] sc-207: one-time import, after sc-206 and sc-204

### 9. Gmail alerts

- [ ] sc-208: link Google (read-only, encrypted tokens)
- [ ] sc-209: Reconnect Gmail prompt, after sc-208 (either order with sc-210)
- [ ] sc-210: label reader + ProcessedEmail, after sc-208
- [ ] sc-211: Haiku extraction into stub jobs, after sc-210
- [ ] sc-212: fill stubs through JSearch, after sc-211

### 10. Filters and scheduling

- [ ] sc-213: geocoding (either order with sc-214)
- [ ] sc-214: search areas settings
- [ ] sc-215: home-base + radius filter, after sc-213 and sc-214
- [ ] sc-216: hard salary filter
- [ ] sc-217: "Show hidden" + restore, after sc-216 and sc-201
- [ ] sc-218: worker + daily scheduler (off by default)
