# Halibut — Screen Spec (loose, from iPad sketch, Nov 16)

Next.js App Router web app, single user for now (the database already supports more users), desktop-first. Tailwind + shadcn/ui.
These are loose screen ideas, not final designs. See **Open questions** and **Design notes** at the bottom.

---

## Global layout
Shared layout in `app/layout.tsx`, used by every page:

```
┌──────────────────────────────────────────────────────────────┐
│ [🐟 logo] Halibut     Jobs   Applications        [+ Resume] │  ← Nav (same on every page)
├──────────────────────────────────────────────────────────────┤
│ Page title                               [page actions]      │  ← Page header (changes per page)
├──────────────────────────────────────────────────────────────┤
│ Page content                                                 │
└──────────────────────────────────────────────────────────────┘
```

### Nav (global, identical everywhere)
- **Left: logo slot + "Halibut" wordmark.**
  - For now: the halibut favicon at ~28–32px.
  - Later: a hand-drawn halibut (the girlfriend's art). Keep the slot square, and keep the logo in a single file (`public/logo.svg` or `.png`) so swapping it is a one-file change.
- **Center/left: nav links:** Jobs (`/`), Applications (`/applications`). Highlight the active link.
- **Right: Upload Resume** (opens the modal) and **Sign out**.
- No per-page buttons in the nav.

### Page header (per page)
- Page title on the left, that page's action buttons on the right.
- This is where "Search more" (Home) and Import/Export (Applications) go.

---

## 1. Home / Jobs — `/`
Main job feed, one feed per resume.

**Page header**
- Title: Jobs
- Action: **Search more** (fetches new jobs from every source, for every resume)

**Resume tabs** (Home only, not in the nav)
- One tab per resume. **Primary first, then the rest alphabetically.**
- Last tab: **"+ Add resume"** (opens the same Upload Resume modal).

**Body**
- Full-width list of job rows ranked by match to the active resume. Row shows title, company, location/remote, salary if known, match score, posted date.
- Clicking a row opens the **Job Detail modal** (screen 4).

---

## 2. Applications — `/applications`
Application tracking, modeled on the "Applications 2026" Google Sheets tab.

**Page header**
- Title: Applications
- Actions: **Export** (CSV, Google Sheets) and **Import** (CSV, Google Sheets)

**Body**
- Table: company, job title, status, applied date, last update, link.
- Sortable; filter by status.

---

## 3. Upload Resume — modal
- Opened from the nav button or the "+ Add resume" tab.
- File picker (PDF/DOCX), resume name, **Set as primary** checkbox.
- On save: the resume is parsed and embedded, and a new tab appears on Home.

---

## 4. Job Detail — modal
Quick in-and-out view of one job. Opens over the Home list.

**Contents**
- Job info: title, company, location/remote, salary, source, posted date, link to the original posting
- **AI evaluation against the job framework**: verdict + reasoning
- Actions: **Mark as applied** (creates an Application), **Dismiss / Not interested**

**Interaction**
- **Prev / Next arrows** to move through the list without closing the modal
- Keyboard: `←` / `→` (or `j` / `k`) for prev/next, `Esc` to close
- Closing returns to the same scroll position in the list
- Built with Next.js **intercepting routes** (`@modal` slot + `(.)jobs/[id]`), so each job has its own URL. Clicking a job always opens the modal. Refreshing, or opening a job's link directly, shows the same content as a plain page, because Next.js needs a real `/jobs/[id]` page for that. It reuses the modal's content, so there's nothing extra to design.

---

## 5. Login — `/login`
- Email and password. No sign-up link: accounts are created from the command line.
- Use a ready-made login form rather than designing one: shadcn/ui's `login-01` block, wired to Better Auth, or Better Auth UI's shadcn components.
- After signing in, go to Jobs.

---

## Open questions
1. **Applications: one master list or one list per resume?**
   - Decided: one master list, with no resume column. Applying happens on the employer's site, so Halibut doesn't know which resume was sent. Per-resume lists would also make it easy to lose track of whether you've already applied somewhere.
2. **Import button: permanent or one-time?**
   - Decided: one-time. Move it to a settings page or a first-run step, leaving Export as the only page action.
3. **Duplicate jobs across resume tabs:** if the same job matches two resumes, does it show in both tabs? Should applying from one tab mark it as applied in the other?
   - Decided: yes to both. Tabs are views of one pool of jobs, so it's the same job in both tabs, and applying shows in both.
4. **Dismissing jobs:** is there a "not interested" action so passed jobs stop showing up?
   - Decided: yes. Not interested hides the job from every tab.

### Still open (likely backlog tickets)
These have data behind them in the schema but no screen yet. None of them change the schema.

5. **Show hidden jobs:** a toggle on Jobs that shows jobs hidden by the hard filters or by Not interested, with the reason on each. It's the only way to undo a Not interested.
6. **Home-base picker:** where on Jobs to pick Pomona, Los Angeles or Redlands and the radius, and where to add or edit home bases.
7. **Last fetched:** a line near Search more showing when each source last ran and whether it failed.
8. **Paste a job description:** a way to add the description in the Job Detail modal for jobs that arrive without one (mostly from alert emails).
9. **Search terms on resume upload:** a field in the Upload Resume modal showing the suggested search terms, editable before saving.
10. **Reconnect Gmail:** a prompt when Gmail access expires (about weekly while the Google project is in Testing status).

---

## Design notes (pushback on the original sketch)
- **Hamburger dropdown → visible nav links.** On a desktop app with only two pages, a hamburger menu hides both main destinations behind an extra click. Hamburgers are a mobile pattern.
- **Page actions don't go in the nav.** If the nav's buttons change per page (Search more vs Import/Export), it stops being a stable landmark. Keep the nav identical everywhere and give each page its own header bar.
- **The AI evaluation needs a home.** It's the main reason for Halibut over a plain job board, and the original sketch had no place for it. It now lives in the Job Detail modal.
- **Modals for triage need prev/next.** Without them, reviewing 30 jobs means 30 open/close cycles. With arrow keys, the modal works almost as fast as a side panel.
- **Tabs scale to about 4–5 resumes.** Beyond that, switch to a dropdown selector. With three resume versions, tabs are fine.