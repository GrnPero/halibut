import { describe, expect, test } from "vitest";

import { jobEvaluationSchema } from "@/features/evaluation/schemas";
import {
  INVALID_ENUM_VALUE,
  validJobEvaluation,
} from "@tests/helpers/fixtures";

const sections = Object.keys(jobEvaluationSchema.shape);

// Paths of the rejected input's issues, so each test checks it failed for the
// reason it is about.
function issuePaths(input: unknown) {
  const result = jobEvaluationSchema.safeParse(input);

  return result.success ? [] : result.error.issues.map((issue) => issue.path);
}

describe("jobEvaluationSchema", () => {
  test("accepts a complete evaluation", () => {
    expect(issuePaths(validJobEvaluation)).toEqual([]);
  });

  test.each(sections)("rejects an evaluation missing %s", (section) => {
    const input: Record<string, unknown> = structuredClone(validJobEvaluation);

    delete input[section];

    expect(issuePaths(input)).toEqual([[section]]);
  });

  test("rejects an unknown verdict", () => {
    const input = { ...validJobEvaluation, verdict: INVALID_ENUM_VALUE };

    expect(issuePaths(input)).toEqual([["verdict"]]);
  });

  describe("engineering environment findings", () => {
    const { engineeringEnvironment } = validJobEvaluation;
    const [firstFinding, ...otherFindings] = engineeringEnvironment.findings;
    const basisPath = ["engineeringEnvironment", "findings", 0, "basis"];

    function withFirstFinding(finding: Record<string, unknown>) {
      return {
        ...validJobEvaluation,
        engineeringEnvironment: {
          ...engineeringEnvironment,
          findings: [finding, ...otherFindings],
        },
      };
    }

    test("rejects a basis other than confirmed, inferred or unknown", () => {
      const input = withFirstFinding({
        ...firstFinding,
        basis: INVALID_ENUM_VALUE,
      });

      expect(issuePaths(input)).toEqual([basisPath]);
    });

    test("rejects a finding with no basis", () => {
      const findingWithoutBasis: Record<string, unknown> = { ...firstFinding };

      delete findingWithoutBasis.basis;

      expect(issuePaths(withFirstFinding(findingWithoutBasis))).toEqual([
        basisPath,
      ]);
    });
  });
});
