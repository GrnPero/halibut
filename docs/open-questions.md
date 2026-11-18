# Halibut: open questions and backlog

Things left out of V1, and limitations accepted for now. Not tickets yet.

Decisions that are needed before building (where the screens and the schema
disagree, the embeddings provider, hard filter rules and so on) are in
[`design.md`](./design.md), section 11.

## Open questions

### Two different companies with the same name

`Company.normalizedName` is unique, so two different businesses with the same
name (e.g. two "Apex Systems") are merged into one row.

- Impact: jobs stay separate, but they share one company record, so details
  like industry can be wrong for one of them. In rare cases, the same title in
  the same city at both companies would be treated as one job by the
  fingerprint.
- Most likely with generic names and staffing agencies.
- Possible fix: use `domain` to tell them apart (same name + different website
  = different company). Only helps when the source provides a domain.
- V1 decision: accept it and watch for it.

### Is `domain` worth keeping?

Nothing in V1 depends on it. It becomes useful if we fix the same-name problem
above.

## Backlog (later versions)

- **Python scraping service (V2).** FastAPI + JobSpy for the big boards, only if
  V1's sources keep missing jobs you'd find by hand.
- **Company career boards.** Greenhouse, Lever, Ashby and Workable public JSON,
  harvested from apply links. Needs new fields on `Company` (board type and
  slug); they were removed from the V1 schema.
- **Fuzzy duplicate detection.** Flag jobs at the same company with nearly
  identical embeddings as likely duplicates (catches "Sr." vs "Senior").
- **Multi-office jobs.** A `JobLocation` table if one posting lists several
  offices.
- **Upgrade to Prisma 8** once it reaches general availability.
- **Export applications straight to Google Sheets (V2).** V1 exports CSV,
  which can be imported into Sheets by hand. Writing to Sheets directly needs
  another Google permission.
- **Rejection and interview detection from email.** Each run, a narrow Gmail
  search (recent emails with phrases like "not moving forward"), Haiku
  classifies matches as rejection / interview request / other, the app matches
  them to an application by company and suggests a status change you confirm.
  `ProcessedEmail` prevents handling the same email twice. Note: Gmail's
  read-only scope covers the whole mailbox; limiting what Halibut reads is a
  rule in the code. In V1, status is updated by hand in the app.

## To do outside the code

- Set up the Gmail filter that puts job alert emails under one label.
