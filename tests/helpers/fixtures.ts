// Halibut: shared test fixtures. Made-up data only: no real postings,
// resumes, salaries or companies.

import type { JobEvaluation } from "@/features/evaluation/schemas";

// A string that no enum in the app allows.
export const INVALID_ENUM_VALUE = "not_a_listed_value";

// A complete evaluation that fills every section (A-H) of the schema.
export const validJobEvaluation: JobEvaluation = {
  executiveSummary:
    "Mid-size product team building a scheduling app; solid fit with a few unknowns.",

  technicalAlignment: {
    matchingTech: ["TypeScript", "React", "PostgreSQL"],
    transferableExperience: ["REST API design"],
    missingTech: ["Go"],
    learningCurve: "moderate",
    advancesCapabilities: true,
    legacyConcern: "none",
    notes: "Go is used for one internal service only.",
  },

  engineeringEnvironment: {
    soloDeveloperRisk: "none",
    findings: [
      {
        topic: "team_size",
        claim: "Team of about eight engineers.",
        basis: "confirmed",
        evidence: "join our team of 8 engineers",
      },
      {
        topic: "code_review",
        claim: "Pull requests are reviewed.",
        basis: "inferred",
        evidence: null,
      },
    ],
  },

  compensationAndLogistics: {
    salaryMin: null,
    salaryMax: null,
    salaryPeriod: null,
    employmentType: "w2_full_time",
    workMode: "remote",
    benefitsNotes: null,
    commuteNotes: null,
    overallValue: "Salary not listed; ask early.",
  },

  redFlags: [
    {
      flag: "Posting lists on-call duties without a rotation size.",
      severity: "minor",
      basis: "confirmed",
      evidence: "participate in on-call",
    },
  ],
  unknowns: ["Salary range"],

  aiEngineering: {
    substance: "not_applicable",
    notes: null,
  },

  careerTrajectory: "Room to own a service within a year.",

  interviewQuestions: [
    {
      question: "How large is the on-call rotation?",
      reveals: "workload",
    },
  ],

  verdict: "APPLY",
  verdictReason: "Good stack match; salary is the main unknown.",
};
