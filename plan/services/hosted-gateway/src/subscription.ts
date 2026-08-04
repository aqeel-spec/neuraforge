import type { FieldError } from "@neuraforge/schemas";

import type { BillingCycle } from "./billing-cycle.js";
import { HOSTED_PLAN_IDS, type HostedPlanId } from "./pricing.js";

/**
 * Hosted Subscription model.
 *
 * Subscriptions record which Hosted Plan and Pricing Version an account/organization is
 * billed under, its current Billing Cycle, and any scheduled downgrade or cancellation
 * (Requirements 18.22-18.26). Subscription state lives entirely inside the hosted
 * gateway's isolated store - it is never consulted by, or merged into, Registry or MCP
 * core contracts (design.md "Monorepo boundaries": `services/hosted-gateway` must not
 * depend on artifact-tier authorization, and `packages/mcp-core` must not depend on
 * billing/auth/quota).
 */

export type SubscriptionStatus = "active" | "canceled" | "inactive";

export interface ScheduledPlanChange {
  planId: HostedPlanId;
  /** ISO-8601 UTC timestamp at which the scheduled plan takes effect. */
  effectiveAt: string;
}

export interface Subscription {
  accountOrOrganizationId: string;
  planId: HostedPlanId;
  pricingVersionId: string;
  status: SubscriptionStatus;
  currentBillingCycle: BillingCycle;
  /** Present while a downgrade is scheduled for the next Billing Cycle (Requirement 18.23). */
  scheduledPlanChange?: ScheduledPlanChange;
  /** Present once cancellation has been requested (Requirement 18.25). */
  cancellation?: { requestedAt: string; accessEndAt: string };
  /** True once billing renewal has been disabled by cancellation. */
  renewalEnabled: boolean;
}

export interface SubscriptionValidation {
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

function validateBillingCycleShape(candidate: unknown, path: string, errors: FieldError[]): void {
  if (!isRecord(candidate) || !isTimestamp(candidate.startAt) || !isTimestamp(candidate.endAt)) {
    error(
      errors,
      "invalid_billing_cycle",
      path,
      "must publish a UTC startAt and endAt timestamp",
      "Publish the current Billing Cycle's exact UTC start and end timestamps.",
    );
    return;
  }
  if (new Date(candidate.startAt).valueOf() >= new Date(candidate.endAt).valueOf()) {
    error(
      errors,
      "invalid_billing_cycle_order",
      path,
      "startAt must be earlier than endAt",
      "Publish a Billing Cycle whose end is after its start.",
    );
  }
}

const SUBSCRIPTION_STATUSES = new Set<SubscriptionStatus>(["active", "canceled", "inactive"]);

/**
 * Validates a candidate Subscription record: identifiers, an exact Starter/Pro/Team
 * plan ID, a well-formed current Billing Cycle, a recognized status, and (when present)
 * a complete scheduled-plan-change or cancellation record.
 */
export function validateSubscription(
  candidate: unknown,
  path = "subscription",
): SubscriptionValidation {
  const errors: FieldError[] = [];

  if (!isRecord(candidate)) {
    error(
      errors,
      "subscription_required",
      path,
      "must be a Subscription object",
      "Publish a complete Subscription record.",
    );
    return { valid: false, errors };
  }

  if (!isNonEmptyString(candidate.accountOrOrganizationId)) {
    error(
      errors,
      "required",
      `${path}.accountOrOrganizationId`,
      "must be a non-empty string",
      "Identify the account or organization this subscription belongs to.",
    );
  }
  if (!HOSTED_PLAN_IDS.includes(candidate.planId as HostedPlanId)) {
    error(
      errors,
      "invalid_plan",
      `${path}.planId`,
      'must be "starter", "pro", or "team"',
      "Assign an exact published Hosted Plan.",
    );
  }
  if (!isNonEmptyString(candidate.pricingVersionId)) {
    error(
      errors,
      "required",
      `${path}.pricingVersionId`,
      "must be a non-empty string",
      "Record the exact Pricing Version governing this subscription.",
    );
  }
  if (!SUBSCRIPTION_STATUSES.has(candidate.status as SubscriptionStatus)) {
    error(
      errors,
      "invalid_status",
      `${path}.status`,
      'must be "active", "canceled", or "inactive"',
      "Publish a recognized subscription status.",
    );
  }
  validateBillingCycleShape(candidate.currentBillingCycle, `${path}.currentBillingCycle`, errors);

  if (candidate.scheduledPlanChange !== undefined) {
    const change = candidate.scheduledPlanChange;
    if (
      !isRecord(change) ||
      !HOSTED_PLAN_IDS.includes(change.planId as HostedPlanId) ||
      !isTimestamp(change.effectiveAt)
    ) {
      error(
        errors,
        "invalid_scheduled_plan_change",
        `${path}.scheduledPlanChange`,
        "must publish an exact plan ID and UTC effective timestamp",
        "Publish the scheduled downgrade's plan and Billing Cycle effective timestamp.",
      );
    }
  }
  if (candidate.cancellation !== undefined) {
    const cancellation = candidate.cancellation;
    if (
      !isRecord(cancellation) ||
      !isTimestamp(cancellation.requestedAt) ||
      !isTimestamp(cancellation.accessEndAt)
    ) {
      error(
        errors,
        "invalid_cancellation",
        `${path}.cancellation`,
        "must publish a UTC requestedAt and accessEndAt timestamp",
        "Publish when cancellation was requested and when hosted access ends.",
      );
    }
  }
  if (typeof candidate.renewalEnabled !== "boolean") {
    error(
      errors,
      "required",
      `${path}.renewalEnabled`,
      "must be a boolean",
      "Publish whether this subscription will renew.",
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Requirement 18.1/18.26: whether a subscription currently grants hosted MCP access.
 * `canceled` subscriptions remain active through their disclosed access end
 * (Requirement 18.25); afterward they must be transitioned to `inactive` by the caller.
 */
export function isSubscriptionActiveAt(subscription: Subscription, timestamp: string): boolean {
  if (subscription.status === "inactive") return false;
  if (subscription.status === "canceled" && subscription.cancellation) {
    return (
      new Date(timestamp).valueOf() < new Date(subscription.cancellation.accessEndAt).valueOf()
    );
  }
  return subscription.status === "active";
}
