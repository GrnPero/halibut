// Halibut: allowed values for every "kind of thing" column.
//
// The database stores these as plain strings. This file is the single source
// of truth: parse with these schemas before every write, and use the exported
// types everywhere else. Adding a value is a one-line change here, with no
// database migration.

import { z } from "zod";

// JobSighting.source, IngestRun.source
export const SourceKind = z.enum([
  "jsearch",
  "larajobs_rss",
  "email_alert",
  "manual", // pasted in by hand
  "sheet_import", // one-time import of the existing Google Sheet
]);
export type SourceKind = z.infer<typeof SourceKind>;

// Job.roleCategory. Set once when the job is first saved (title rules first,
// then the LLM for ambiguous titles). Exported to the sheet's Role column.
export const RoleCategory = z.enum([
  "full_stack",
  "backend",
  "frontend",
  "mobile",
  "ai_engineering",
  "other",
  "unknown", // not classified yet
]);
export type RoleCategory = z.infer<typeof RoleCategory>;

// Job.workMode
export const WorkMode = z.enum(["remote", "hybrid", "onsite", "unknown"]);
export type WorkMode = z.infer<typeof WorkMode>;

// Job.salaryPeriod
export const SalaryPeriod = z.enum(["year", "hour"]);
export type SalaryPeriod = z.infer<typeof SalaryPeriod>;

// Job.employmentType
export const EmploymentType = z.enum([
  "w2_full_time",
  "contract",
  "contract_to_hire",
  "part_time",
  "unknown",
]);
export type EmploymentType = z.infer<typeof EmploymentType>;

// Evaluation.verdict (the framework's four verdicts)
export const Verdict = z.enum(["STRONG_APPLY", "APPLY", "INVESTIGATE", "PASS"]);
export type Verdict = z.infer<typeof Verdict>;

// Application.status. Matches the Status dropdown in the "Applications 2026"
// sheet tab word for word, so the export round-trips.
export const ApplicationStatus = z.enum([
  "draft",
  "sent",
  "phone call",
  "interview",
  "rejection",
  "offer",
  "pending",
]);
export type ApplicationStatus = z.infer<typeof ApplicationStatus>;

// IngestRun.status
export const RunStatus = z.enum(["running", "succeeded", "failed"]);
export type RunStatus = z.infer<typeof RunStatus>;
