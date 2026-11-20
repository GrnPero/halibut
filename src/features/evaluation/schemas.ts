// Halibut: structured output for the framework evaluation.
//
// Sections map to the framework's "Required Job Evaluation Format" (A-H).
// Pass jobEvaluationSchema to the AI SDK's structured-output call, with the
// framework text as the system prompt and the posting + resume as the user
// message. Store the validated object in Evaluation.result.
//
// Fields are nullable rather than optional so the model must address each one.

import { z } from "zod";

import { EmploymentType, SalaryPeriod, Verdict, WorkMode } from "@/lib/enums";

// "Separate facts, reasonable inferences, and unknowns."
const basis = z.enum(["confirmed", "inferred", "unknown"]);

const finding = z.object({
  topic: z.enum([
    "team_size",
    "seniority_distribution",
    "mentorship",
    "architecture_responsibilities",
    "code_review",
    "testing_and_ci",
    "technical_maturity",
    "stability",
    "workload",
    "other",
  ]),
  claim: z.string(),
  basis,
  evidence: z
    .string()
    .nullable()
    .describe("Short phrase from the posting that supports the claim, or null"),
});

export const jobEvaluationSchema = z.object({
  // A. Executive Summary
  executiveSummary: z.string(),

  // B. Technical Alignment
  technicalAlignment: z.object({
    matchingTech: z.array(z.string()),
    transferableExperience: z.array(z.string()),
    missingTech: z.array(z.string()),
    learningCurve: z.enum(["low", "moderate", "steep"]),
    advancesCapabilities: z.boolean(),
    legacyConcern: z.enum([
      "none",
      "legacy_with_modernization_plan",
      "legacy_no_plan",
      "unclear",
    ]),
    notes: z.string(),
  }),

  // C. Engineering Environment
  engineeringEnvironment: z.object({
    soloDeveloperRisk: z.enum(["none", "possible", "likely", "confirmed"]),
    findings: z.array(finding),
  }),

  // D. Compensation and Logistics
  // The model only extracts numbers. The salary tier is computed in code
  // (salaryTier below) so it can never be argued upward.
  compensationAndLogistics: z.object({
    salaryMin: z.number().nullable(),
    salaryMax: z.number().nullable(),
    salaryPeriod: SalaryPeriod.nullable(),
    employmentType: EmploymentType,
    workMode: WorkMode,
    benefitsNotes: z.string().nullable(),
    commuteNotes: z.string().nullable(),
    overallValue: z.string(),
  }),

  // E. Red Flags and Unknowns (kept separate, as the framework requires)
  redFlags: z.array(
    z.object({
      flag: z.string(),
      severity: z.enum(["minor", "major", "dealbreaker"]),
      basis: z.enum(["confirmed", "inferred"]),
      evidence: z.string().nullable(),
    }),
  ),
  unknowns: z.array(z.string()),

  // Framework section 7: AI-native roles
  aiEngineering: z.object({
    substance: z.enum([
      "real_engineering",
      "tool_usage_only",
      "buzzwords",
      "not_applicable",
    ]),
    notes: z.string().nullable(),
  }),

  // F. Career Trajectory
  careerTrajectory: z.string(),

  // G. Interview Questions
  interviewQuestions: z.array(
    z.object({
      question: z.string(),
      reveals: z.enum([
        "team_structure",
        "why_role_is_open",
        "technical_debt",
        "architecture_ownership",
        "workload",
        "mentorship",
        "other",
      ]),
    }),
  ),

  // H. Final Verdict
  verdict: Verdict,
  verdictReason: z.string(),
});

export type JobEvaluation = z.infer<typeof jobEvaluationSchema>;

// ---------- Deterministic compensation helpers ----------

export type SalaryTier =
  | "ideal" // at or above salaryIdealMin
  | "preferred_minimum" // at or above salaryPreferredMin
  | "below_target" // at or above salaryFloor: requires strong justification
  | "usually_pass" // below salaryFloor
  | "unlisted";

// The three thresholds stored on the active Framework row. Pass the row itself:
// it has these fields.
export type SalaryThresholds = {
  salaryIdealMin: number;
  salaryPreferredMin: number;
  salaryFloor: number;
};

const HOURS_PER_YEAR = 2080;

// An hourly contract rate is not equivalent to the same W-2 salary (no
// benefits, no paid time off). This only puts both on one scale for sorting.
export function annualize(
  amount: number | null,
  period: SalaryPeriod | null,
): number | null {
  if (amount === null || period === null) return null;
  return period === "hour" ? Math.round(amount * HOURS_PER_YEAR) : amount;
}

// Thresholds come from the active Framework row, not from code, so they stay
// out of the public repo. Pass whichever end of the salary range you want to
// judge by; the bottom is the conservative choice.
export function salaryTier(
  annualAmount: number | null,
  thresholds: SalaryThresholds,
): SalaryTier {
  if (annualAmount === null) return "unlisted";
  if (annualAmount >= thresholds.salaryIdealMin) return "ideal";
  if (annualAmount >= thresholds.salaryPreferredMin) return "preferred_minimum";
  if (annualAmount >= thresholds.salaryFloor) return "below_target";
  return "usually_pass";
}
