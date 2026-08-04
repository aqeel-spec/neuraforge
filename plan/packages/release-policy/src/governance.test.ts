import { describe, expect, it } from "vitest";

import {
  addCalendarDays,
  calculateGovernanceDeadlines,
  validateGovernanceModel,
  validateGovernanceProposal,
  type GovernanceModel,
  type GovernanceProposal,
} from "./governance.js";

const publicLink = (url: string) => ({ url, visibility: "public" as const });

const model: GovernanceModel = {
  schemaVersion: "1.0.0",
  proposalFields: [
    { key: "title", label: "Title", description: "Proposal title", required: true },
    { key: "motivation", label: "Motivation", description: "Reason for change", required: true },
    { key: "alternatives", label: "Alternatives", description: "Other options", required: false },
  ],
  completenessRule: "Every required field must contain a non-empty value.",
  reviewCriteria: ["community impact", "accessibility", "security"],
  reviewWindow: { value: 14, unit: "calendar_days" },
  decisionDeadline: { value: 7, unit: "calendar_days" },
  decisionAuthority: {
    id: "maintainer-council",
    allowedRoles: ["maintainer"],
    minimumDecisionMakers: 2,
  },
  decisionRule: { method: "consensus", rule: "Consensus after conflict recusals." },
  conflictResolution: "Disclose conflicts; conflicted participants recuse.",
  correctionPath: publicLink("/governance/proposals/correct"),
  resubmissionPath: publicLink("/governance/proposals/resubmit"),
  maintainerSelection: {
    eligibilityCriteria: ["six accepted contributions", "community conduct in good standing"],
    nominationPath: publicLink("/governance/maintainers/nominate"),
    conflictDisclosurePath: publicLink("/governance/maintainers/conflicts"),
    reviewWindow: { value: 14, unit: "calendar_days" },
    decisionDeadline: { value: 7, unit: "calendar_days" },
    appealPath: publicLink("/governance/maintainers/appeal"),
    appealWindow: { value: 14, unit: "calendar_days" },
  },
  maintainerRemoval: {
    criteria: ["sustained inactivity", "serious conduct breach"],
    authority: "maintainer-council",
    appealPath: publicLink("/governance/maintainers/removal-appeal"),
  },
  leadershipSuccession: {
    triggers: ["resignation", "incapacity"],
    process: "The maintainer council selects an interim lead by consensus.",
    authority: "maintainer-council",
  },
};

const evidence = [
  {
    id: "evidence-1",
    title: "Community discussion",
    source: publicLink("https://example.test/discussions/1"),
  },
];

const baseProposal: GovernanceProposal = {
  id: "proposal-1",
  submittedBy: "contributor-1",
  submittedAt: "2026-01-01",
  submission: { title: "Adopt a policy", motivation: "Improve transparency" },
  status: "review",
  schedule: {
    reviewStart: "2026-01-02",
    reviewDeadline: "2026-01-16",
    decisionDeadline: "2026-01-23",
  },
  reviewers: [
    { id: "maintainer-1", role: "maintainer" },
    { id: "maintainer-2", role: "maintainer" },
  ],
  conflictDisclosures: [
    { participantId: "maintainer-1", status: "none" },
    {
      participantId: "maintainer-2",
      status: "disclosed",
      details: "Contributed to an earlier draft.",
      recused: false,
    },
  ],
  evidence,
  delays: [],
};

const codes = (result: ReturnType<typeof validateGovernanceProposal>) =>
  result.errors.map((entry) => entry.code);

describe("governance calendar deadlines", () => {
  it("uses UTC calendar dates across leap-day and month boundaries", () => {
    expect(addCalendarDays("2024-02-28", 2)).toBe("2024-03-01");
    expect(
      calculateGovernanceDeadlines(
        "2026-01-25",
        { value: 10, unit: "calendar_days" },
        { value: 5, unit: "calendar_days" },
      ),
    ).toEqual({ reviewDeadline: "2026-02-04", decisionDeadline: "2026-02-09" });
  });

  it("rejects timestamps and non-integer day counts", () => {
    expect(() => addCalendarDays("2026-01-01T00:00:00Z", 1)).toThrow(RangeError);
    expect(() => addCalendarDays("2026-01-01", 1.5)).toThrow(RangeError);
  });
});

describe("Governance Model validation", () => {
  it("accepts complete public proposal, authority, nomination, removal, succession, and appeal rules", () => {
    expect(validateGovernanceModel(model)).toEqual({ valid: true, errors: [] });
  });

  it("rejects non-calendar timing and non-public nomination or appeal metadata", () => {
    const invalid: GovernanceModel = {
      ...model,
      reviewWindow: { value: 0, unit: "calendar_days" },
      maintainerSelection: {
        ...model.maintainerSelection,
        nominationPath: { url: "internal", visibility: "public" },
        appealPath: { url: "/appeal", visibility: "public" },
        appealWindow: { value: -1, unit: "calendar_days" },
      },
    };
    const result = validateGovernanceModel(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.map((entry) => entry.path)).toEqual(
      expect.arrayContaining([
        "reviewWindow.value",
        "maintainerSelection.nominationPath.url",
        "maintainerSelection.appealWindow.value",
      ]),
    );
  });
});

describe("governance proposal validation", () => {
  it("accepts a complete proposal while its decision window is open", () => {
    expect(validateGovernanceProposal(model, baseProposal, "2026-01-20")).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("reports every missing submission field with documented correction paths", () => {
    const proposal: GovernanceProposal = {
      ...baseProposal,
      submission: {},
      status: "incomplete",
      correction: {
        missingFields: ["title", "motivation"],
        correctionPath: model.correctionPath,
        resubmissionPath: model.resubmissionPath,
      },
    };
    const result = validateGovernanceProposal(model, proposal, "2026-01-05");
    expect(result.valid).toBe(false);
    expect(result.errors.filter((entry) => entry.code === "missing_proposal_field")).toHaveLength(
      2,
    );
    expect(result.errors.every((entry) => entry.code !== "correction_metadata_required")).toBe(
      true,
    );
    expect(result.errors.find((entry) => entry.path === "submission.title")?.guidance).toContain(
      model.resubmissionPath.url,
    );
  });

  it("requires complete correction metadata for an incomplete proposal", () => {
    const result = validateGovernanceProposal(
      model,
      { ...baseProposal, submission: {}, status: "review" },
      "2026-01-05",
    );
    expect(codes(result)).toEqual(
      expect.arrayContaining([
        "missing_proposal_field",
        "incomplete_status_required",
        "correction_metadata_required",
      ]),
    );
  });

  it("validates calendar deadlines, reviewers, conflict disclosures, and evidence", () => {
    const proposal: GovernanceProposal = {
      ...baseProposal,
      schedule: {
        reviewStart: "2026-01-02",
        reviewDeadline: "2026-01-17",
        decisionDeadline: "2026-01-24",
      },
      conflictDisclosures: [],
      evidence: [],
    };
    const result = validateGovernanceProposal(model, proposal, "2026-01-20");
    expect(codes(result)).toEqual(
      expect.arrayContaining([
        "incorrect_review_deadline",
        "incorrect_decision_deadline",
        "missing_conflict_disclosure",
        "evidence_required",
      ]),
    );
  });

  it("requires a delay reason and replacement deadline after a missed deadline", () => {
    const result = validateGovernanceProposal(model, baseProposal, "2026-01-24");
    expect(codes(result)).toContain("overdue_delay_required");

    const delayed: GovernanceProposal = {
      ...baseProposal,
      delays: [
        {
          missedDeadline: "2026-01-23",
          reason: "A security review needs more evidence.",
          replacementDeadline: "2026-01-30",
          publishedAt: "2026-01-24",
        },
      ],
    };
    expect(validateGovernanceProposal(model, delayed, "2026-01-25")).toEqual({
      valid: true,
      errors: [],
    });
  });
});
