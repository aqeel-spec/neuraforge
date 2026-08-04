import type { ErrorEnvelope, ErrorResource, FieldError, OperationError } from "@neuraforge/schemas";

/**
 * Shared error-envelope construction for catalog-core's pure validation functions.
 *
 * Every validator in this package receives its `requestId` from the caller rather than
 * generating one, so results stay deterministic and reproducible for property-based tests.
 */
export interface ValidationContext {
  requestId: string;
}

function buildEnvelope(
  code: string,
  category: OperationError["category"],
  message: string,
  fields: FieldError[],
  resource: ErrorResource,
  context: ValidationContext,
): ErrorEnvelope {
  return {
    error: {
      code,
      category,
      message,
      retryable: false,
      fields,
      resource,
      requestId: context.requestId,
    },
  };
}

/** Builds an envelope for structurally missing/malformed/unresolved data. */
export function buildValidationErrorEnvelope(
  code: string,
  message: string,
  fields: FieldError[],
  resource: ErrorResource,
  context: ValidationContext,
): ErrorEnvelope {
  return buildEnvelope(code, "validation", message, fields, resource, context);
}

/** Builds an envelope for entitlement-free-access and license-compatibility policy violations. */
export function buildPolicyErrorEnvelope(
  code: string,
  message: string,
  fields: FieldError[],
  resource: ErrorResource,
  context: ValidationContext,
): ErrorEnvelope {
  return buildEnvelope(code, "policy", message, fields, resource, context);
}

export function fieldError(
  code: string,
  path: string,
  constraint: string,
  guidance: string,
): FieldError {
  return { code, path, constraint, guidance };
}

export function prefixFieldErrors(errors: FieldError[], prefix: string): FieldError[] {
  return errors.map((error) => ({
    ...error,
    path: prefix ? `${prefix}.${error.path}` : error.path,
  }));
}
