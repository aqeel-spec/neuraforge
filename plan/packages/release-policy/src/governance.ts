import type { FieldError } from "@neuraforge-ui/schemas";

export interface CalendarWindow {
  value: number;
  unit: "calendar_days";
}
export interface PublicProcessLink {
  url: string;
  visibility: "public";
}
export interface ProposalFieldDefinition {
  key: string;
  label: string;
  description: string;
  required: boolean;
}
export interface DecisionAuthority {
  id: string;
  allowedRoles: string[];
  minimumDecisionMakers: number;
}
export interface GovernanceModel {
  schemaVersion: string;
  proposalFields: ProposalFieldDefinition[];
  completenessRule: string;
  reviewCriteria: string[];
  reviewWindow: CalendarWindow;
  decisionDeadline: CalendarWindow;
  decisionAuthority: DecisionAuthority;
  decisionRule: { method: "consensus" | "vote"; rule: string };
  conflictResolution: string;
  correctionPath: PublicProcessLink;
  resubmissionPath: PublicProcessLink;
  maintainerSelection: {
    eligibilityCriteria: string[];
    nominationPath: PublicProcessLink;
    conflictDisclosurePath: PublicProcessLink;
    reviewWindow: CalendarWindow;
    decisionDeadline: CalendarWindow;
    appealPath: PublicProcessLink;
    appealWindow: CalendarWindow;
  };
  maintainerRemoval: { criteria: string[]; authority: string; appealPath: PublicProcessLink };
  leadershipSuccession: { triggers: string[]; process: string; authority: string };
}

export interface GovernanceParticipant {
  id: string;
  role: string;
}
export interface ConflictDisclosure {
  participantId: string;
  status: "none" | "disclosed";
  details?: string;
  recused?: boolean;
}
export interface GovernanceEvidence {
  id: string;
  title: string;
  source: PublicProcessLink;
}
export interface GovernanceDecision {
  outcome: "accepted" | "rejected" | "deferred" | "withdrawn";
  rationale: string;
  decisionMakers: GovernanceParticipant[];
  conflictDisclosures: ConflictDisclosure[];
  evidenceConsidered: GovernanceEvidence[];
  decisionDate: string;
  authorityId: string;
}
export interface GovernanceDelay {
  missedDeadline: string;
  reason: string;
  replacementDeadline: string;
  publishedAt: string;
}
export interface GovernanceProposal {
  id: string;
  submittedBy: string;
  submittedAt: string;
  submission: Record<string, unknown>;
  status: "incomplete" | "review" | "decision_due" | "decided" | "withdrawn";
  schedule?: { reviewStart: string; reviewDeadline: string; decisionDeadline: string };
  reviewers: GovernanceParticipant[];
  conflictDisclosures: ConflictDisclosure[];
  evidence: GovernanceEvidence[];
  decision?: GovernanceDecision;
  delays: GovernanceDelay[];
  correction?: {
    missingFields: string[];
    correctionPath: PublicProcessLink;
    resubmissionPath: PublicProcessLink;
  };
}
export interface GovernanceValidation {
  valid: boolean;
  errors: FieldError[];
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const text = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const list = (value: unknown): value is unknown[] => Array.isArray(value);

function error(
  errors: FieldError[],
  code: string,
  path: string,
  constraint: string,
  guidance: string,
): void {
  errors.push({ code, path, constraint, guidance });
}

function requireText(errors: FieldError[], value: unknown, path: string): void {
  if (!text(value)) {
    error(errors, "required", path, "must be a non-empty string", `Provide ${path}.`);
  }
}

function validateCalendarWindow(errors: FieldError[], value: unknown, path: string): void {
  const window = value as Partial<CalendarWindow> | undefined;
  if (!window || window.unit !== "calendar_days") {
    error(
      errors,
      "calendar_days_required",
      `${path}.unit`,
      'must equal "calendar_days"',
      "Measure this window in calendar days.",
    );
  }
  if (!window || !Number.isInteger(window.value) || (window.value ?? 0) < 1) {
    error(
      errors,
      "invalid_calendar_window",
      `${path}.value`,
      "must be a positive integer",
      "Provide at least one calendar day.",
    );
  }
}

function isCalendarDate(value: unknown): value is string {
  if (!text(value) || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function validateDate(errors: FieldError[], value: unknown, path: string): value is string {
  if (isCalendarDate(value)) return true;
  error(
    errors,
    "invalid_calendar_date",
    path,
    "must be a real YYYY-MM-DD calendar date",
    "Publish the date without a time or time zone.",
  );
  return false;
}

function validatePublicLink(errors: FieldError[], value: unknown, path: string): void {
  const link = value as Partial<PublicProcessLink> | undefined;
  if (!link || link.visibility !== "public") {
    error(
      errors,
      "public_path_required",
      `${path}.visibility`,
      'must equal "public"',
      "Publish this process without authentication or payment.",
    );
  }
  if (!link || !text(link.url) || !(link.url.startsWith("/") || link.url.startsWith("https://"))) {
    error(
      errors,
      "invalid_public_path",
      `${path}.url`,
      "must be an absolute site path or HTTPS URL",
      "Provide the public repository or documentation path.",
    );
  }
}
function validateTextList(errors: FieldError[], value: unknown, path: string): void {
  if (!list(value) || value.length === 0) {
    error(
      errors,
      "non_empty_list_required",
      path,
      "must contain at least one entry",
      `Publish at least one ${path} entry.`,
    );
    return;
  }
  value.forEach((entry, index) => {
    requireText(errors, entry, `${path}[${String(index)}]`);
  });
}

export function addCalendarDays(date: string, days: number): string {
  if (!isCalendarDate(date) || !Number.isInteger(days)) {
    throw new RangeError("addCalendarDays requires a YYYY-MM-DD date and an integer day count");
  }
  const result = new Date(`${date}T00:00:00.000Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function calculateGovernanceDeadlines(
  reviewStart: string,
  reviewWindow: CalendarWindow,
  decisionDeadline: CalendarWindow,
): { reviewDeadline: string; decisionDeadline: string } {
  const reviewDeadline = addCalendarDays(reviewStart, reviewWindow.value);
  return {
    reviewDeadline,
    decisionDeadline: addCalendarDays(reviewDeadline, decisionDeadline.value),
  };
}

export function validateGovernanceModel(input: GovernanceModel): GovernanceValidation {
  const errors: FieldError[] = [];
  requireText(errors, input.schemaVersion, "schemaVersion");
  if (!list(input.proposalFields) || input.proposalFields.length === 0) {
    error(
      errors,
      "proposal_fields_required",
      "proposalFields",
      "must define at least one submission field",
      "Publish proposal submission fields and completeness rules.",
    );
  } else {
    const keys = new Set<string>();
    input.proposalFields.forEach((field, index) => {
      requireText(errors, field.key, `proposalFields[${String(index)}].key`);
      requireText(errors, field.label, `proposalFields[${String(index)}].label`);
      requireText(errors, field.description, `proposalFields[${String(index)}].description`);
      if (keys.has(field.key)) {
        error(
          errors,
          "duplicate_proposal_field",
          `proposalFields[${String(index)}].key`,
          "must be unique",
          "Use a unique stable field key.",
        );
      }
      keys.add(field.key);
    });
    if (!input.proposalFields.some((field) => field.required)) {
      error(
        errors,
        "required_proposal_field_missing",
        "proposalFields",
        "must mark at least one field required",
        "Mark fields used by the completeness rule as required.",
      );
    }
  }
  requireText(errors, input.completenessRule, "completenessRule");
  validateTextList(errors, input.reviewCriteria, "reviewCriteria");
  validateCalendarWindow(errors, input.reviewWindow, "reviewWindow");
  validateCalendarWindow(errors, input.decisionDeadline, "decisionDeadline");
  requireText(errors, input.decisionAuthority.id, "decisionAuthority.id");
  validateTextList(errors, input.decisionAuthority.allowedRoles, "decisionAuthority.allowedRoles");
  if (
    !Number.isInteger(input.decisionAuthority.minimumDecisionMakers) ||
    input.decisionAuthority.minimumDecisionMakers < 1
  ) {
    error(
      errors,
      "invalid_authority_threshold",
      "decisionAuthority.minimumDecisionMakers",
      "must be a positive integer",
      "Publish the minimum number of authorized decision-makers.",
    );
  }
  requireText(errors, input.decisionRule.rule, "decisionRule.rule");
  requireText(errors, input.conflictResolution, "conflictResolution");
  validatePublicLink(errors, input.correctionPath, "correctionPath");
  validatePublicLink(errors, input.resubmissionPath, "resubmissionPath");
  const selection = input.maintainerSelection;
  validateTextList(
    errors,
    selection.eligibilityCriteria,
    "maintainerSelection.eligibilityCriteria",
  );
  validatePublicLink(errors, selection.nominationPath, "maintainerSelection.nominationPath");
  validatePublicLink(
    errors,
    selection.conflictDisclosurePath,
    "maintainerSelection.conflictDisclosurePath",
  );
  validateCalendarWindow(errors, selection.reviewWindow, "maintainerSelection.reviewWindow");
  validateCalendarWindow(
    errors,
    selection.decisionDeadline,
    "maintainerSelection.decisionDeadline",
  );
  validatePublicLink(errors, selection.appealPath, "maintainerSelection.appealPath");
  validateCalendarWindow(errors, selection.appealWindow, "maintainerSelection.appealWindow");
  validateTextList(errors, input.maintainerRemoval.criteria, "maintainerRemoval.criteria");
  requireText(errors, input.maintainerRemoval.authority, "maintainerRemoval.authority");
  validatePublicLink(errors, input.maintainerRemoval.appealPath, "maintainerRemoval.appealPath");
  validateTextList(errors, input.leadershipSuccession.triggers, "leadershipSuccession.triggers");
  requireText(errors, input.leadershipSuccession.process, "leadershipSuccession.process");
  requireText(errors, input.leadershipSuccession.authority, "leadershipSuccession.authority");
  return { valid: errors.length === 0, errors };
}

function isMissing(value: unknown): boolean {
  return (
    value === undefined || value === null || (typeof value === "string" && value.trim() === "")
  );
}

function validateParticipants(
  errors: FieldError[],
  participants: GovernanceParticipant[],
  disclosures: ConflictDisclosure[],
  path: string,
): void {
  if (!list(participants) || participants.length === 0) {
    error(
      errors,
      "participants_required",
      path,
      "must contain at least one participant",
      "Publish every reviewer or decision-maker.",
    );
    return;
  }
  const participantIds = new Set<string>();
  participants.forEach((participant, index) => {
    requireText(errors, participant.id, `${path}[${String(index)}].id`);
    requireText(errors, participant.role, `${path}[${String(index)}].role`);
    if (participantIds.has(participant.id)) {
      error(
        errors,
        "duplicate_participant",
        `${path}[${String(index)}].id`,
        "must be unique",
        "List each participant once.",
      );
    }
    participantIds.add(participant.id);
  });
  const disclosureIds = new Set<string>();
  if (!list(disclosures)) {
    error(
      errors,
      "conflict_disclosures_required",
      "conflictDisclosures",
      "must be an array",
      "Publish a conflict declaration for every participant.",
    );
    return;
  }
  disclosures.forEach((disclosure, index) => {
    if (disclosureIds.has(disclosure.participantId)) {
      error(
        errors,
        "duplicate_conflict_disclosure",
        `${path}Conflicts[${String(index)}].participantId`,
        "must be unique",
        "Publish one conflict declaration per participant.",
      );
    }
    disclosureIds.add(disclosure.participantId);
    if (!participantIds.has(disclosure.participantId)) {
      error(
        errors,
        "unknown_conflict_participant",
        `${path}Conflicts[${String(index)}].participantId`,
        "must identify a published participant",
        "Remove the disclosure or add the participant.",
      );
    }
    if (
      disclosure.status === "disclosed" &&
      (!text(disclosure.details) || typeof disclosure.recused !== "boolean")
    ) {
      error(
        errors,
        "incomplete_conflict_disclosure",
        `${path}Conflicts[${String(index)}]`,
        "disclosed conflicts require details and recusal status",
        "Publish the conflict and whether the participant recused.",
      );
    }
  });
  participantIds.forEach((id) => {
    if (!disclosureIds.has(id)) {
      error(
        errors,
        "missing_conflict_disclosure",
        `${path}Conflicts`,
        `must include participant ${id}`,
        "Publish either a no-conflict declaration or disclosed conflict details.",
      );
    }
  });
}

function validateEvidence(
  errors: FieldError[],
  evidence: GovernanceEvidence[],
  path: string,
): void {
  if (!list(evidence) || evidence.length === 0) {
    error(
      errors,
      "evidence_required",
      path,
      "must contain evidence considered",
      "Publish the evidence considered, including evidence of no supporting material if applicable.",
    );
    return;
  }
  evidence.forEach((item, index) => {
    requireText(errors, item.id, `${path}[${String(index)}].id`);
    requireText(errors, item.title, `${path}[${String(index)}].title`);
    validatePublicLink(errors, item.source, `${path}[${String(index)}].source`);
  });
}
function validateDecision(
  errors: FieldError[],
  model: GovernanceModel,
  decision: GovernanceDecision,
): void {
  requireText(errors, decision.rationale, "decision.rationale");
  validateDate(errors, decision.decisionDate, "decision.decisionDate");
  if (decision.authorityId !== model.decisionAuthority.id) {
    error(
      errors,
      "invalid_decision_authority",
      "decision.authorityId",
      `must equal ${model.decisionAuthority.id}`,
      "Use the published decision authority.",
    );
  }
  validateParticipants(
    errors,
    decision.decisionMakers,
    decision.conflictDisclosures,
    "decision.decisionMakers",
  );
  if (decision.decisionMakers.length < model.decisionAuthority.minimumDecisionMakers) {
    error(
      errors,
      "insufficient_decision_authority",
      "decision.decisionMakers",
      `must contain at least ${String(model.decisionAuthority.minimumDecisionMakers)} decision-makers`,
      "Add authorized participating decision-makers.",
    );
  }
  decision.decisionMakers.forEach((participant, index) => {
    if (!model.decisionAuthority.allowedRoles.includes(participant.role)) {
      error(
        errors,
        "unauthorized_decision_maker",
        `decision.decisionMakers[${String(index)}].role`,
        "must be an allowed decision-authority role",
        "Use a role published by the Governance Model.",
      );
    }
  });
  validateEvidence(errors, decision.evidenceConsidered, "decision.evidenceConsidered");
}

function validateDelays(
  errors: FieldError[],
  delays: GovernanceDelay[],
  initialDeadline: string,
): string {
  let effectiveDeadline = initialDeadline;
  delays.forEach((delay, index) => {
    const prefix = `delays[${String(index)}]`;
    const missedValid = validateDate(errors, delay.missedDeadline, `${prefix}.missedDeadline`);
    const replacementValid = validateDate(
      errors,
      delay.replacementDeadline,
      `${prefix}.replacementDeadline`,
    );
    validateDate(errors, delay.publishedAt, `${prefix}.publishedAt`);
    requireText(errors, delay.reason, `${prefix}.reason`);
    if (missedValid && delay.missedDeadline !== effectiveDeadline) {
      error(
        errors,
        "invalid_missed_deadline",
        `${prefix}.missedDeadline`,
        `must equal the current deadline ${effectiveDeadline}`,
        "Link each delay to the deadline it replaces.",
      );
    }
    if (replacementValid && delay.replacementDeadline <= effectiveDeadline) {
      error(
        errors,
        "invalid_replacement_deadline",
        `${prefix}.replacementDeadline`,
        "must be later than the missed deadline",
        "Publish a later replacement calendar deadline.",
      );
    } else if (replacementValid) {
      effectiveDeadline = delay.replacementDeadline;
    }
  });
  return effectiveDeadline;
}

export function validateGovernanceProposal(
  model: GovernanceModel,
  proposal: GovernanceProposal,
  asOf: string,
): GovernanceValidation {
  const errors = [...validateGovernanceModel(model).errors];
  requireText(errors, proposal.id, "id");
  requireText(errors, proposal.submittedBy, "submittedBy");
  validateDate(errors, proposal.submittedAt, "submittedAt");
  const asOfValid = validateDate(errors, asOf, "asOf");
  const missingFields = model.proposalFields
    .filter((field) => field.required && isMissing(proposal.submission[field.key]))
    .map((field) => field.key);

  missingFields.forEach((field) => {
    error(
      errors,
      "missing_proposal_field",
      `submission.${field}`,
      "is required by the Governance Model completeness rule",
      `Correct at ${model.correctionPath.url} and resubmit at ${model.resubmissionPath.url}.`,
    );
  });

  if (missingFields.length > 0) {
    if (proposal.status !== "incomplete") {
      error(
        errors,
        "incomplete_status_required",
        "status",
        'must equal "incomplete" while required fields are missing',
        "Mark the proposal incomplete until corrected.",
      );
    }
    if (!proposal.correction) {
      error(
        errors,
        "correction_metadata_required",
        "correction",
        "must identify every missing field and correction/resubmission path",
        `Publish correction metadata using ${model.correctionPath.url}.`,
      );
    } else {
      const publishedMissing = [...new Set(proposal.correction.missingFields)].sort();
      const expectedMissing = [...missingFields].sort();
      if (publishedMissing.join("\0") !== expectedMissing.join("\0")) {
        error(
          errors,
          "incomplete_missing_field_list",
          "correction.missingFields",
          "must list every and only missing required field",
          "Publish the complete missing-field list.",
        );
      }
      validatePublicLink(errors, proposal.correction.correctionPath, "correction.correctionPath");
      validatePublicLink(
        errors,
        proposal.correction.resubmissionPath,
        "correction.resubmissionPath",
      );
      if (
        proposal.correction.correctionPath.url !== model.correctionPath.url ||
        proposal.correction.resubmissionPath.url !== model.resubmissionPath.url
      ) {
        error(
          errors,
          "incorrect_correction_path",
          "correction",
          "must use the Governance Model correction and resubmission paths",
          "Publish the documented correction paths without substitution.",
        );
      }
    }
    return { valid: errors.length === 0, errors };
  }

  if (proposal.status === "incomplete") {
    error(
      errors,
      "complete_proposal_status",
      "status",
      "must advance after all required fields are supplied",
      "Publish the review status and schedule.",
    );
  }
  if (!proposal.schedule) {
    error(
      errors,
      "schedule_required",
      "schedule",
      "complete proposals require review start, review deadline, and decision deadline",
      "Publish the calendar schedule.",
    );
    return { valid: errors.length === 0, errors };
  }
  const reviewStartValid = validateDate(
    errors,
    proposal.schedule.reviewStart,
    "schedule.reviewStart",
  );
  const reviewDeadlineValid = validateDate(
    errors,
    proposal.schedule.reviewDeadline,
    "schedule.reviewDeadline",
  );
  const decisionDeadlineValid = validateDate(
    errors,
    proposal.schedule.decisionDeadline,
    "schedule.decisionDeadline",
  );
  if (reviewStartValid && reviewDeadlineValid && decisionDeadlineValid) {
    const expected = calculateGovernanceDeadlines(
      proposal.schedule.reviewStart,
      model.reviewWindow,
      model.decisionDeadline,
    );
    if (proposal.schedule.reviewDeadline !== expected.reviewDeadline) {
      error(
        errors,
        "incorrect_review_deadline",
        "schedule.reviewDeadline",
        `must equal ${expected.reviewDeadline}`,
        "Calculate the deadline using the published calendar-day review window.",
      );
    }
    if (proposal.schedule.decisionDeadline !== expected.decisionDeadline) {
      error(
        errors,
        "incorrect_decision_deadline",
        "schedule.decisionDeadline",
        `must equal ${expected.decisionDeadline}`,
        "Calculate the deadline from the review deadline using the published calendar-day decision window.",
      );
    }
  }
  validateParticipants(errors, proposal.reviewers, proposal.conflictDisclosures, "reviewers");
  validateEvidence(errors, proposal.evidence, "evidence");

  let effectiveDeadline = proposal.schedule.decisionDeadline;
  if (decisionDeadlineValid) {
    effectiveDeadline = validateDelays(errors, proposal.delays, effectiveDeadline);
  }
  if (proposal.decision) {
    validateDecision(errors, model, proposal.decision);
    if (proposal.status !== "decided" && proposal.status !== "withdrawn") {
      error(
        errors,
        "final_status_required",
        "status",
        "must reflect the published final decision",
        "Set status to decided or withdrawn.",
      );
    }
    if (
      decisionDeadlineValid &&
      proposal.decision.decisionDate > proposal.schedule.decisionDeadline &&
      proposal.delays.length === 0
    ) {
      error(
        errors,
        "late_decision_delay_required",
        "delays",
        "a decision after its deadline requires a reason and replacement deadline",
        "Publish a delay record linked to the missed deadline.",
      );
    }
    if (proposal.decision.decisionDate > effectiveDeadline) {
      error(
        errors,
        "decision_after_effective_deadline",
        "decision.decisionDate",
        "must not be later than the latest published replacement deadline",
        "Publish another delay and replacement deadline before recording the outcome.",
      );
    }
  } else {
    if (proposal.status === "decided" || proposal.status === "withdrawn") {
      error(
        errors,
        "decision_record_required",
        "decision",
        "final status requires outcome, rationale, participants, conflicts, evidence, authority, and date",
        "Publish the final decision record.",
      );
    }
    if (asOfValid && decisionDeadlineValid && asOf > effectiveDeadline) {
      error(
        errors,
        "overdue_delay_required",
        "delays",
        "an overdue undecided proposal requires a delay reason and later replacement deadline",
        "Publish a delay record before continuing review.",
      );
    }
  }
  return { valid: errors.length === 0, errors };
}
