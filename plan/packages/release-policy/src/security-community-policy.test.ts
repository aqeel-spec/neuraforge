import { describe, expect, it } from "vitest";

import {
  isVersionSupported,
  renderConductPolicy,
  renderContributionTerms,
  renderMaintainerList,
  renderPublicParticipationWorkflows,
  renderPublicPolicyIndex,
  renderSecurityAdvisory,
  validateAccessibilityRegressionRecord,
  validateConductPolicy,
  validateContributionTerms,
  validateMaintainerList,
  validateMaintainerNomination,
  validatePrivateReportChannel,
  validatePublicParticipationWorkflows,
  validatePublicPolicyIndex,
  validateRestrictedConductReport,
  validateSecurityAdvisory,
  validateSecurityPolicy,
  validateSecurityReportLifecycle,
  validateThreatModel,
  THREAT_MODEL_SURFACES,
  type ConductPolicy,
  type ContributionTerms,
  type MaintainerNomination,
  type MaintainerRecord,
  type PrivateReportChannel,
  type PublicParticipationWorkflows,
  type PublicPolicyIndex,
  type RestrictedConductReport,
  type RestrictedSecurityReportLifecycle,
  type SecurityAdvisory,
  type SecurityPolicy,
  type ThreatModel,
} from "./security-community-policy.js";

const publicLink = (url: string) => ({ url, visibility: "public" as const });

const securityPolicy: SecurityPolicy = {
  schemaVersion: "1.0.0",
  supportedReleaseRanges: [{ startVersion: "1.0.0" }],
  acknowledgementDeadline: { value: 3, unit: "calendar_days" },
  triageDeadline: { value: 7, unit: "calendar_days" },
  reporterUpdateInterval: { value: 14, unit: "calendar_days" },
  disclosureProcess: publicLink("/security/disclosure"),
  severityDefinitions: [
    { level: "low", description: "Minimal impact" },
    { level: "critical", description: "Severe impact" },
  ],
};

describe("validateSecurityPolicy", () => {
  it("accepts a complete security policy", () => {
    expect(validateSecurityPolicy(securityPolicy)).toEqual({ valid: true, errors: [] });
  });

  it("rejects missing ranges, invalid versions, and duplicate severity levels", () => {
    const invalid: SecurityPolicy = {
      ...securityPolicy,
      supportedReleaseRanges: [{ startVersion: "not-a-version" }],
      severityDefinitions: [
        { level: "low", description: "a" },
        { level: "low", description: "b" },
      ],
    };
    const result = validateSecurityPolicy(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.map((entry) => entry.code)).toEqual(
      expect.arrayContaining(["invalid_semantic_version", "duplicate_severity_level"]),
    );
  });
});

describe("validatePrivateReportChannel", () => {
  it("accepts a valid channel", () => {
    const channel: PrivateReportChannel = {
      schemaVersion: "1.0.0",
      channelType: "email",
      contactReference: "security@example.test",
      confidentialityNotice: "Reports are kept private until coordinated disclosure.",
    };
    expect(validatePrivateReportChannel(channel)).toEqual({ valid: true, errors: [] });
  });

  it("rejects an unsupported channel type", () => {
    const channel = {
      schemaVersion: "1.0.0",
      channelType: "carrier-pigeon",
      contactReference: "x",
      confidentialityNotice: "x",
    } as unknown as PrivateReportChannel;
    const result = validatePrivateReportChannel(channel);
    expect(result.valid).toBe(false);
    expect(result.errors.map((entry) => entry.code)).toContain("invalid_channel_type");
  });
});

describe("validateThreatModel", () => {
  it("accepts a model that covers every required surface", () => {
    const entry = {
      protectedAssets: ["source"],
      trustBoundaries: ["public internet"],
      threatActors: ["opportunistic attacker"],
      abuseCases: ["dependency tampering"],
      mitigations: ["checksum verification"],
      residualRisks: ["unpatched transitive dependency"],
    };
    const model: ThreatModel = {
      schemaVersion: "1.0.0",
      surfaces: Object.fromEntries(THREAT_MODEL_SURFACES.map((surface) => [surface, entry])),
    };
    expect(validateThreatModel(model)).toEqual({ valid: true, errors: [] });
  });

  it("reports every missing required surface", () => {
    const result = validateThreatModel({ schemaVersion: "1.0.0", surfaces: {} });
    expect(result.valid).toBe(false);
    expect(
      result.errors.filter((entry) => entry.code === "missing_threat_model_surface"),
    ).toHaveLength(THREAT_MODEL_SURFACES.length);
  });
});

describe("validateSecurityReportLifecycle", () => {
  it("accepts an on-time acknowledged, triaged, and updated lifecycle", () => {
    const lifecycle: RestrictedSecurityReportLifecycle = {
      reportId: "report-1",
      receivedAt: "2026-01-01",
      acknowledgedAt: "2026-01-02",
      triagedAt: "2026-01-05",
      updates: [{ at: "2026-01-10", summary: "Investigating root cause." }],
    };
    expect(validateSecurityReportLifecycle(securityPolicy, lifecycle, "2026-01-12")).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("reports an overdue acknowledgement", () => {
    const lifecycle: RestrictedSecurityReportLifecycle = {
      reportId: "report-2",
      receivedAt: "2026-01-01",
      updates: [],
    };
    const result = validateSecurityReportLifecycle(securityPolicy, lifecycle, "2026-01-10");
    expect(result.valid).toBe(false);
    expect(result.errors.map((entry) => entry.code)).toContain("acknowledgement_overdue");
  });
});

describe("validateSecurityAdvisory and renderSecurityAdvisory", () => {
  const timeline = {
    reportedAt: "2026-01-01",
    acknowledgedAt: "2026-01-02",
    triagedAt: "2026-01-03",
    disclosedAt: "2026-01-20",
  };

  it("accepts a resolved advisory with fixed versions and migration actions", () => {
    const advisory: SecurityAdvisory = {
      id: "advisory-1",
      affectedVersions: ["1.0.0"],
      severity: "high",
      impact: "Allows unauthorized read access.",
      workarounds: [],
      remediationStatus: "resolved",
      disclosureTimeline: timeline,
      fixedVersions: [{ version: "1.0.1", checksum: "sha256:abc" }],
      migrationActions: ["Upgrade to 1.0.1"],
    };
    expect(validateSecurityAdvisory(advisory, securityPolicy)).toEqual({ valid: true, errors: [] });
  });

  it("requires fixed versions and migrations for a resolved advisory", () => {
    const advisory: SecurityAdvisory = {
      id: "advisory-2",
      affectedVersions: ["1.0.0"],
      severity: "medium",
      impact: "x",
      workarounds: [],
      remediationStatus: "resolved",
      disclosureTimeline: timeline,
    };
    const result = validateSecurityAdvisory(advisory, securityPolicy);
    expect(result.valid).toBe(false);
    expect(result.errors.map((entry) => entry.code)).toEqual(
      expect.arrayContaining(["fixed_versions_required", "migration_actions_required"]),
    );
  });

  it("rejects fix metadata published before remediation is resolved", () => {
    const advisory: SecurityAdvisory = {
      id: "advisory-3",
      affectedVersions: ["1.0.0"],
      severity: "low",
      impact: "x",
      workarounds: [],
      remediationStatus: "in_progress",
      disclosureTimeline: timeline,
      fixedVersions: [{ version: "1.0.1", checksum: "sha256:abc" }],
    };
    const result = validateSecurityAdvisory(advisory, securityPolicy);
    expect(result.valid).toBe(false);
    expect(result.errors.map((entry) => entry.code)).toContain("premature_fix_metadata");
  });

  it("requires a supported-release remediation target for unsupported affected versions", () => {
    const advisory: SecurityAdvisory = {
      id: "advisory-4",
      affectedVersions: ["0.5.0"],
      severity: "low",
      impact: "x",
      workarounds: [],
      remediationStatus: "unresolved",
      disclosureTimeline: timeline,
    };
    const result = validateSecurityAdvisory(advisory, securityPolicy);
    expect(result.valid).toBe(false);
    expect(result.errors.map((entry) => entry.code)).toContain("supported_release_target_required");
  });

  it("renders a public advisory from a completed confidential lifecycle without leaking internal update summaries", () => {
    const lifecycle: RestrictedSecurityReportLifecycle = {
      reportId: "report-3",
      receivedAt: "2026-01-01",
      acknowledgedAt: "2026-01-02",
      triagedAt: "2026-01-03",
      updates: [{ at: "2026-01-05", summary: "Internal-only detail." }],
      disclosureCoordinatedAt: "2026-01-20",
    };
    const advisory = renderSecurityAdvisory(lifecycle, {
      id: "advisory-5",
      affectedVersions: ["1.0.0"],
      severity: "high",
      impact: "Public impact summary.",
      workarounds: [],
      remediationStatus: "unresolved",
    });
    expect(advisory.disclosureTimeline).toEqual({
      reportedAt: "2026-01-01",
      acknowledgedAt: "2026-01-02",
      triagedAt: "2026-01-03",
      disclosedAt: "2026-01-20",
    });
    expect(JSON.stringify(advisory)).not.toContain("Internal-only detail");
  });

  it("throws when rendering from a lifecycle that has not completed disclosure", () => {
    const lifecycle: RestrictedSecurityReportLifecycle = {
      reportId: "report-4",
      receivedAt: "2026-01-01",
      updates: [],
    };
    expect(() =>
      renderSecurityAdvisory(lifecycle, {
        id: "advisory-6",
        affectedVersions: ["1.0.0"],
        severity: "low",
        impact: "x",
        workarounds: [],
        remediationStatus: "unresolved",
      }),
    ).toThrow(RangeError);
  });
});

describe("isVersionSupported", () => {
  it("accepts versions inside a bounded and an open-ended range", () => {
    const ranges = [{ startVersion: "1.0.0", endVersion: "1.5.0" }, { startVersion: "2.0.0" }];
    expect(isVersionSupported("1.2.0", ranges)).toBe(true);
    expect(isVersionSupported("3.0.0", ranges)).toBe(true);
    expect(isVersionSupported("1.9.0", ranges)).toBe(false);
    expect(isVersionSupported("not-a-version", ranges)).toBe(false);
  });
});

describe("validateAccessibilityRegressionRecord", () => {
  it("accepts a complete regression record", () => {
    const record = {
      id: "regression-1",
      affectedVersions: ["1.0.0"],
      userImpact: "Screen reader users cannot dismiss the dialog.",
      remediationStatus: "in_progress" as const,
      workaround: "Use the Escape key.",
    };
    expect(validateAccessibilityRegressionRecord(record)).toEqual({ valid: true, errors: [] });
  });

  it("rejects an invalid remediation status", () => {
    const record = {
      id: "regression-2",
      affectedVersions: ["1.0.0"],
      userImpact: "x",
      remediationStatus: "ignored" as never,
      workaround: "x",
    };
    const result = validateAccessibilityRegressionRecord(record);
    expect(result.valid).toBe(false);
    expect(result.errors.map((entry) => entry.code)).toContain("invalid_remediation_status");
  });
});

describe("validatePublicPolicyIndex and renderPublicPolicyIndex", () => {
  const index: PublicPolicyIndex = {
    schemaVersion: "1.0.0",
    governanceModelPath: publicLink("/governance/model"),
    contributionGuidePath: publicLink("/contributing"),
    codeOfConductPath: publicLink("/conduct"),
    maintainerListPath: publicLink("/governance/maintainers"),
    contributionTermsPath: publicLink("/contributing/terms"),
    decisionProcessPath: publicLink("/governance/decisions"),
    correctionProcessPath: publicLink("/governance/corrections"),
  };

  it("accepts a complete public policy index and renders it unchanged", () => {
    expect(validatePublicPolicyIndex(index)).toEqual({ valid: true, errors: [] });
    expect(renderPublicPolicyIndex(index)).toEqual(index);
  });

  it("rejects a non-public path", () => {
    const invalid: PublicPolicyIndex = {
      ...index,
      codeOfConductPath: { url: "/conduct", visibility: "internal" as never },
    };
    const result = validatePublicPolicyIndex(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.map((entry) => entry.code)).toContain("public_path_required");
  });
});

describe("validateContributionTerms and renderContributionTerms", () => {
  const terms: ContributionTerms = {
    schemaVersion: "1.0.0",
    license: "MIT",
    attributionPolicy: "Contributors are credited in release notes.",
    thirdPartyProvenancePolicy: "Third-party material requires documented provenance.",
    contributorAuthorityStatement: "Contributors confirm authority to license their submission.",
  };

  it("accepts MIT-licensed contribution terms", () => {
    expect(validateContributionTerms(terms)).toEqual({ valid: true, errors: [] });
    expect(renderContributionTerms(terms)).toEqual(terms);
  });

  it("rejects a non-MIT license", () => {
    const invalid = { ...terms, license: "Proprietary" as never };
    const result = validateContributionTerms(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.map((entry) => entry.code)).toContain("open_source_license_required");
  });
});

describe("validateConductPolicy, renderConductPolicy, and validateRestrictedConductReport", () => {
  const conductPolicy: ConductPolicy = {
    schemaVersion: "1.0.0",
    reportingContact: publicLink("/conduct/report"),
    accessControlRoles: ["conduct-committee"],
    conflictOfInterestRule: "Committee members disclose conflicts before review.",
    recusalRule: "Conflicted members recuse from the decision.",
    retentionPeriod: { value: 365, unit: "calendar_days" },
    appealPath: publicLink("/conduct/appeal"),
    enforcementProcess: "The committee decides by majority vote.",
  };

  it("accepts a complete public conduct policy and renders only public fields", () => {
    expect(validateConductPolicy(conductPolicy)).toEqual({ valid: true, errors: [] });
    expect(renderConductPolicy(conductPolicy)).toEqual(conductPolicy);
  });

  it("validates a restricted conduct report and its recusal records", () => {
    const report: RestrictedConductReport = {
      reportId: "conduct-1",
      reportedAt: "2026-01-01",
      participantIds: ["contributor-1"],
      accessRoles: ["conduct-committee"],
      details: "Confidential report details.",
      recusals: [
        { participantId: "maintainer-1", reason: "Personal relationship with the reporter." },
      ],
      retentionExpiresAt: "2027-01-01",
    };
    expect(validateRestrictedConductReport(report)).toEqual({ valid: true, errors: [] });
  });

  it("rejects an undefined enforcement outcome", () => {
    const report: RestrictedConductReport = {
      reportId: "conduct-2",
      reportedAt: "2026-01-01",
      participantIds: ["contributor-1"],
      accessRoles: ["conduct-committee"],
      details: "x",
      recusals: [],
      retentionExpiresAt: "2027-01-01",
      outcome: "escalated" as never,
    };
    const result = validateRestrictedConductReport(report);
    expect(result.valid).toBe(false);
    expect(result.errors.map((entry) => entry.code)).toContain("invalid_outcome");
  });
});

describe("validateMaintainerList and renderMaintainerList", () => {
  const maintainers: MaintainerRecord[] = [
    {
      id: "maintainer-1",
      displayName: "Ada",
      role: "lead-maintainer",
      responsibilities: ["release approval"],
      activeSince: "2025-01-01",
    },
  ];

  it("accepts a non-empty unique maintainer list and renders public fields", () => {
    expect(validateMaintainerList(maintainers)).toEqual({ valid: true, errors: [] });
    expect(renderMaintainerList(maintainers)).toEqual(maintainers);
  });

  it("rejects an empty maintainer list and duplicate maintainer IDs", () => {
    expect(validateMaintainerList([]).valid).toBe(false);
    const [first] = maintainers;
    if (!first) throw new Error("fixture requires at least one maintainer");
    const duplicate = [...maintainers, { ...first }];
    const result = validateMaintainerList(duplicate);
    expect(result.valid).toBe(false);
    expect(result.errors.map((entry) => entry.code)).toContain("duplicate_maintainer");
  });
});

describe("validateMaintainerNomination", () => {
  const timing = {
    reviewWindow: { value: 14, unit: "calendar_days" as const },
    decisionDeadline: { value: 7, unit: "calendar_days" as const },
    appealWindow: { value: 14, unit: "calendar_days" as const },
  };
  const eligibilityCriteria = ["six accepted contributions", "good community standing"];

  const baseNomination: MaintainerNomination = {
    id: "nomination-1",
    nomineeId: "contributor-1",
    submittedAt: "2026-01-01",
    eligibilityEvidence: ["Merged six accepted pull requests.", "No conduct violations on record."],
    status: "review",
    schedule: {
      reviewStart: "2026-01-02",
      reviewDeadline: "2026-01-16",
      decisionDeadline: "2026-01-23",
    },
    reviewers: [{ id: "maintainer-1", role: "maintainer" }],
    conflictDisclosures: [{ participantId: "maintainer-1", status: "none" }],
  };

  it("accepts a nomination under review with complete eligibility evidence and schedule", () => {
    expect(validateMaintainerNomination(eligibilityCriteria, timing, baseNomination)).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("requires eligibility evidence for every published criterion", () => {
    const nomination: MaintainerNomination = {
      ...baseNomination,
      eligibilityEvidence: ["one item"],
    };
    const result = validateMaintainerNomination(eligibilityCriteria, timing, nomination);
    expect(result.valid).toBe(false);
    expect(result.errors.map((entry) => entry.code)).toContain("incomplete_eligibility_evidence");
  });

  it("requires a decision record once status is decided", () => {
    const nomination: MaintainerNomination = { ...baseNomination, status: "decided" };
    const result = validateMaintainerNomination(eligibilityCriteria, timing, nomination);
    expect(result.valid).toBe(false);
    expect(result.errors.map((entry) => entry.code)).toContain("decision_record_required");
  });

  it("rejects an appeal filed after the published appeal window", () => {
    const nomination: MaintainerNomination = {
      ...baseNomination,
      status: "appealed",
      decision: {
        outcome: "rejected",
        rationale: "Did not meet eligibility criteria.",
        decisionMakers: [{ id: "maintainer-1", role: "maintainer" }],
        decisionDate: "2026-01-23",
        authorityId: "maintainer-council",
      },
      appeal: { filedAt: "2026-02-20", rationale: "Requesting reconsideration." },
    };
    const result = validateMaintainerNomination(eligibilityCriteria, timing, nomination);
    expect(result.valid).toBe(false);
    expect(result.errors.map((entry) => entry.code)).toContain("appeal_window_expired");
  });
});

describe("validatePublicParticipationWorkflows and renderPublicParticipationWorkflows", () => {
  const workflows: PublicParticipationWorkflows = {
    schemaVersion: "1.0.0",
    issuesPath: publicLink("/issues"),
    discussionsPath: publicLink("/discussions"),
    proposalsPath: publicLink("/governance/proposals"),
    changeReviewPath: publicLink("/pulls"),
  };

  it("accepts complete public participation workflow links and renders them unchanged", () => {
    expect(validatePublicParticipationWorkflows(workflows)).toEqual({ valid: true, errors: [] });
    expect(renderPublicParticipationWorkflows(workflows)).toEqual(workflows);
  });

  it("rejects a non-HTTPS, non-absolute workflow path", () => {
    const invalid: PublicParticipationWorkflows = {
      ...workflows,
      issuesPath: { url: "issues", visibility: "public" },
    };
    const result = validatePublicParticipationWorkflows(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.map((entry) => entry.code)).toContain("invalid_public_path");
  });
});
