/**
 * Billing Cycle and Quota Window models.
 *
 * A Billing Cycle is a monthly Hosted_MCP_Service service period with explicit UTC
 * start/end timestamps (Requirement 18.3). A Quota Window is the half-open UTC day
 * `[00:00:00, next 00:00:00)` during which a Hosted Plan's daily MCP_Call quota applies
 * and resets used calls to zero (Requirement 18.12).
 *
 * Both models are pure calendar arithmetic: given a timestamp, they deterministically
 * compute the window/cycle boundaries. No I/O or persistence lives here.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface QuotaWindow {
  /** Inclusive UTC-day start, e.g. "2025-06-01T00:00:00.000Z". */
  windowStart: string;
  /** Exclusive UTC-day end / next reset timestamp, e.g. "2025-06-02T00:00:00.000Z". */
  resetAt: string;
}

function toUtcDate(timestamp: string): Date {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.valueOf())) {
    throw new RangeError(`Invalid timestamp: ${timestamp}`);
  }
  return parsed;
}

/**
 * Requirement 18.12: assigns a request timestamp to its half-open UTC-day Quota Window
 * and calculates the exact next-midnight-UTC reset timestamp.
 */
export function resolveQuotaWindow(timestamp: string): QuotaWindow {
  const date = toUtcDate(timestamp);
  const windowStartMs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return {
    windowStart: new Date(windowStartMs).toISOString(),
    resetAt: new Date(windowStartMs + MS_PER_DAY).toISOString(),
  };
}

/** True when `timestamp` falls within `[window.windowStart, window.resetAt)`. */
export function isWithinQuotaWindow(timestamp: string, window: QuotaWindow): boolean {
  const t = toUtcDate(timestamp).valueOf();
  return t >= toUtcDate(window.windowStart).valueOf() && t < toUtcDate(window.resetAt).valueOf();
}

export interface BillingCycle {
  /** Inclusive UTC Billing Cycle start. */
  startAt: string;
  /** Exclusive UTC Billing Cycle end (the next cycle's start). */
  endAt: string;
}

/**
 * Requirement 18.3: computes the monthly Billing Cycle containing `anchorTimestamp`,
 * using `cycleStartDay` (the UTC day-of-month, 1-31) as the cycle's recurring boundary.
 * When the calendar month has fewer days than `cycleStartDay`, the cycle starts on the
 * month's last day (clamped), matching common monthly-subscription billing semantics.
 */
export function resolveBillingCycle(anchorTimestamp: string, cycleStartDay: number): BillingCycle {
  if (!Number.isInteger(cycleStartDay) || cycleStartDay < 1 || cycleStartDay > 31) {
    throw new RangeError("cycleStartDay must be an integer between 1 and 31");
  }
  const anchor = toUtcDate(anchorTimestamp);
  const year = anchor.getUTCFullYear();
  const month = anchor.getUTCMonth();

  const clampedStart = (y: number, m: number): Date => {
    const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return new Date(Date.UTC(y, m, Math.min(cycleStartDay, daysInMonth)));
  };

  let cycleStart = clampedStart(year, month);
  if (anchor.valueOf() < cycleStart.valueOf()) {
    cycleStart = clampedStart(year, month - 1);
  }
  const nextMonth = new Date(
    Date.UTC(cycleStart.getUTCFullYear(), cycleStart.getUTCMonth() + 1, 1),
  );
  const cycleEnd = clampedStart(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth());

  return { startAt: cycleStart.toISOString(), endAt: cycleEnd.toISOString() };
}

/** True when `timestamp` falls within `[cycle.startAt, cycle.endAt)`. */
export function isWithinBillingCycle(timestamp: string, cycle: BillingCycle): boolean {
  const t = toUtcDate(timestamp).valueOf();
  return t >= toUtcDate(cycle.startAt).valueOf() && t < toUtcDate(cycle.endAt).valueOf();
}

/** Requirement 18.25/18.26: the Billing Cycle immediately following `cycle`. */
export function nextBillingCycle(cycle: BillingCycle, cycleStartDay: number): BillingCycle {
  return resolveBillingCycle(cycle.endAt, cycleStartDay);
}
