import type { FieldError, JsonValue } from "@neuraforge/schemas";

/**
 * Hosted Pricing Version model.
 *
 * A Pricing Version is a published, immutable identifier for a set of Hosted Plan
 * prices, quotas, effective timestamps, and transition terms (Requirements 18.2,
 * 18.19-18.21). This module fixes the Initial Pricing Version's exact Starter, Pro, and
 * Team values (Requirement 18.20) and defines the closed per-plan contract that limits
 * plan differences to daily quota and documented administration metadata (Requirements
 * 18.4, 18.5): `HostedPlanDefinition` has no field capable of expressing artifact-tier or
 * operation-tier access, so no Pricing Version can encode one.
 *
 * This module models pricing data only. Publishing a *new* Pricing Version (30-day lead
 * time, prospective effective timestamps, upgrade/downgrade/cancellation activation) is
 * implemented by later tasks (9.14, 9.16, 9.18) and reuses these types.
 */

export type HostedPlanId = "starter" | "pro" | "team";

export const HOSTED_PLAN_IDS: readonly HostedPlanId[] = ["starter", "pro", "team"];

/** A single Hosted Plan's price, daily MCP_Call quota, and documented admin limits. */
export interface HostedPlanDefinition {
  /** Monthly USD price in integer cents (avoids floating-point currency error). */
  monthlyUsdCents: number;
  /** MCP_Call requests permitted per Quota_Window (Requirement 18.2, 18.12). */
  dailyLimit: number;
  /** Documented account/organization administration limits only - never artifact access. */
  adminLimits: JsonValue;
}

export interface PricingVersionTransitionTerms {
  upgrade: string;
  downgrade: string;
  cancellation: string;
}

export interface PricingVersion {
  id: string;
  /** ISO-8601 UTC timestamp when this Pricing Version was published. */
  publishedAt: string;
  /** ISO-8601 UTC timestamp when this Pricing Version takes effect. */
  effectiveAt: string;
  plans: Readonly<Record<HostedPlanId, Readonly<HostedPlanDefinition>>>;
  countingRulesVersion: string;
  transitionTerms: Readonly<PricingVersionTransitionTerms>;
}

/** Requirement 18.2: the Initial Pricing Version's exact Starter/Pro/Team values. */
export const INITIAL_PRICING_VERSION_ID = "pricing-v1";

function frozenPlan(plan: HostedPlanDefinition): Readonly<HostedPlanDefinition> {
  return Object.freeze({ ...plan });
}

/**
 * The Initial Pricing Version, per Requirement 18.2 and 18.20: Starter USD 9/month with
 * a 500 daily quota, Pro USD 29/month with a 3,000 daily quota, and Team USD 79/month
 * with a 10,000 daily quota. This object is deeply frozen and MUST NOT be mutated;
 * publishing a different Pricing Version never edits these values (Requirement 18.20).
 */
export const INITIAL_PRICING_VERSION: PricingVersion = Object.freeze({
  id: INITIAL_PRICING_VERSION_ID,
  publishedAt: "2025-01-01T00:00:00.000Z",
  effectiveAt: "2025-01-01T00:00:00.000Z",
  plans: Object.freeze({
    starter: frozenPlan({
      monthlyUsdCents: 900,
      dailyLimit: 500,
      adminLimits: Object.freeze({ maxMembers: 1, maxOrganizations: 1, maxBillingContacts: 1 }),
    }),
    pro: frozenPlan({
      monthlyUsdCents: 2900,
      dailyLimit: 3000,
      adminLimits: Object.freeze({ maxMembers: 10, maxOrganizations: 1, maxBillingContacts: 3 }),
    }),
    team: frozenPlan({
      monthlyUsdCents: 7900,
      dailyLimit: 10000,
      adminLimits: Object.freeze({ maxMembers: 50, maxOrganizations: 5, maxBillingContacts: 10 }),
    }),
  }),
  countingRulesVersion: "counting-rules-v1",
  transitionTerms: Object.freeze({
    upgrade:
      "Activates the higher daily quota at the confirmed effective timestamp; current-window calls used are retained.",
    downgrade:
      "Scheduled for the next Billing Cycle; the current plan and quota remain active through the current Billing Cycle end.",
    cancellation:
      "Disables renewal; hosted access is preserved through the current Billing Cycle end, then becomes inactive.",
  }),
});

/** Requirement 18.6: the monthly charge is the published plan price with no per-call overage. */
export function calculateMonthlyChargeCents(plan: Readonly<HostedPlanDefinition>): number {
  return plan.monthlyUsdCents;
}

export interface PricingValidation {
  valid: boolean;
  errors: FieldError[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(new Date(value).valueOf());
}

function error(
  errors: FieldError[],
  code: string,
  path: string,
  constraint: string,
  guidance: string,
): void {
  errors.push({ code, path, constraint, guidance });
}

const PLAN_ALLOWED_FIELDS = new Set<keyof HostedPlanDefinition>([
  "monthlyUsdCents",
  "dailyLimit",
  "adminLimits",
]);

function validatePlanDefinition(candidate: unknown, path: string, errors: FieldError[]): void {
  if (!isRecord(candidate)) {
    error(
      errors,
      "plan_definition_required",
      path,
      "must be a HostedPlanDefinition object",
      "Publish the plan's monthly price, daily limit, and admin limits.",
    );
    return;
  }
  for (const key of Object.keys(candidate)) {
    if (!PLAN_ALLOWED_FIELDS.has(key as keyof HostedPlanDefinition)) {
      error(
        errors,
        "unexpected_plan_field",
        `${path}.${key}`,
        "must not declare fields outside the closed HostedPlanDefinition contract",
        "Remove the field; a Hosted Plan may only differ by price, daily quota, and documented administration limits.",
      );
    }
  }
  if (!Number.isInteger(candidate.monthlyUsdCents) || (candidate.monthlyUsdCents as number) <= 0) {
    error(
      errors,
      "invalid_monthly_price",
      `${path}.monthlyUsdCents`,
      "must be a positive integer number of USD cents",
      "Publish the exact monthly USD price in integer cents.",
    );
  }
  if (!Number.isInteger(candidate.dailyLimit) || (candidate.dailyLimit as number) <= 0) {
    error(
      errors,
      "invalid_daily_limit",
      `${path}.dailyLimit`,
      "must be a positive integer",
      "Publish the exact daily MCP_Call quota.",
    );
  }
  if (candidate.adminLimits === undefined) {
    error(
      errors,
      "admin_limits_required",
      `${path}.adminLimits`,
      "must publish documented administration limits",
      "Publish the plan's account/organization administration limits.",
    );
  }
}

/**
 * Validates a candidate Pricing Version's structural completeness: an exact Starter,
 * Pro, and Team plan set with no additional or missing plan IDs, well-formed prices and
 * quotas closed to quota/admin fields only, timestamps, a counting-rules version, and
 * complete transition terms.
 */
export function validatePricingVersion(
  candidate: unknown,
  path = "pricingVersion",
): PricingValidation {
  const errors: FieldError[] = [];

  if (!isRecord(candidate)) {
    error(
      errors,
      "pricing_version_required",
      path,
      "must be a PricingVersion object",
      "Publish a complete Pricing Version.",
    );
    return { valid: false, errors };
  }

  if (!isNonEmptyString(candidate.id)) {
    error(
      errors,
      "required",
      `${path}.id`,
      "must be a non-empty string",
      "Publish a stable Pricing Version identifier.",
    );
  }
  if (!isTimestamp(candidate.publishedAt)) {
    error(
      errors,
      "invalid_timestamp",
      `${path}.publishedAt`,
      "must be a valid ISO-8601 UTC timestamp",
      "Publish when this Pricing Version was published.",
    );
  }
  if (!isTimestamp(candidate.effectiveAt)) {
    error(
      errors,
      "invalid_timestamp",
      `${path}.effectiveAt`,
      "must be a valid ISO-8601 UTC timestamp",
      "Publish when this Pricing Version takes effect.",
    );
  }
  if (!isNonEmptyString(candidate.countingRulesVersion)) {
    error(
      errors,
      "required",
      `${path}.countingRulesVersion`,
      "must be a non-empty string",
      "Publish the quota-counting rules version.",
    );
  }

  const plans = candidate.plans;
  if (!isRecord(plans)) {
    error(
      errors,
      "plans_required",
      `${path}.plans`,
      "must publish Starter, Pro, and Team plan definitions",
      "Publish exactly the Starter, Pro, and Team Hosted Plans.",
    );
  } else {
    const declaredIds = Object.keys(plans);
    for (const planId of HOSTED_PLAN_IDS) {
      if (!(planId in plans)) {
        error(
          errors,
          "missing_plan",
          `${path}.plans.${planId}`,
          `must publish the ${planId} plan`,
          `Publish the ${planId} Hosted Plan.`,
        );
      } else {
        validatePlanDefinition(plans[planId], `${path}.plans.${planId}`, errors);
      }
    }
    for (const declaredId of declaredIds) {
      if (!HOSTED_PLAN_IDS.includes(declaredId as HostedPlanId)) {
        error(
          errors,
          "unexpected_plan",
          `${path}.plans.${declaredId}`,
          "must not publish a plan outside Starter, Pro, or Team",
          "Remove the unrecognized plan; only Starter, Pro, and Team Hosted Plans are published.",
        );
      }
    }
  }

  const transitionTerms = candidate.transitionTerms;
  if (!isRecord(transitionTerms)) {
    error(
      errors,
      "transition_terms_required",
      `${path}.transitionTerms`,
      "must publish upgrade, downgrade, and cancellation behavior",
      "Publish explicit account transition behavior.",
    );
  } else {
    for (const field of ["upgrade", "downgrade", "cancellation"] as const) {
      if (!isNonEmptyString(transitionTerms[field])) {
        error(
          errors,
          "required",
          `${path}.transitionTerms.${field}`,
          "must be a non-empty string",
          `Publish the ${field} transition behavior.`,
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Requirement 18.20: deep-equality guard confirming a candidate Pricing Version matches
 * the immutable Initial Pricing Version's exact published values (used by callers to
 * detect any accidental mutation before persistence or comparison against later
 * published Pricing Versions).
 */
export function isInitialPricingVersion(candidate: PricingVersion): boolean {
  return (
    candidate.id === INITIAL_PRICING_VERSION.id &&
    canonicalJson(candidate) === canonicalJson(INITIAL_PRICING_VERSION)
  );
}

/** Deterministic deep-sorted JSON serialization used for structural equality checks. */
function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry));
  }
  if (value !== null && typeof value === "object") {
    const sortedKeys = Object.keys(value as Record<string, unknown>).sort();
    const result: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      result[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return result;
  }
  return value;
}
