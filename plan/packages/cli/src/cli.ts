/**
 * CLI command adapter.
 *
 * runCli(argv, io, installer) dispatches search, inspect, install --preview,
 * install (with confirmation), and rollback. Returns numeric exit code.
 * Never calls process.exit. Writes structured output through injected IO.
 */

import type { Installer } from "./installer.js";
import type { MutableTarget } from "./target.js";

export interface CliIO {
  readonly stdout: (data: string) => void;
  readonly stderr: (data: string) => void;
  readonly confirm?: (() => Promise<boolean>) | undefined;
}

export interface CliOptions {
  readonly target?: MutableTarget | undefined;
}

/**
 * Parses argv and runs the appropriate command.
 *
 * Commands:
 *   search <query>
 *   inspect <stableId> <version>
 *   install --preview <stableId> <version> --destination <path>
 *   install <stableId> <version> --destination <path> [--yes --plan-id <id>] [--approve <paths>]
 *   rollback <planId>
 */
export async function runCli(
  argv: readonly string[],
  io: CliIO,
  installer: Installer,
  options?: CliOptions,
): Promise<number> {
  const args = [...argv];

  if (args.length === 0) {
    io.stderr("Usage: neuraforge <command> [options]\n");
    io.stderr("Commands: search, inspect, install, rollback\n");
    return 1;
  }

  const command: string | undefined = args[0];
  if (command === undefined) {
    io.stderr("Usage: neuraforge <command> [options]\n");
    return 1;
  }

  switch (command) {
    case "search":
      return handleSearch(args.slice(1), io, installer);
    case "inspect":
      return handleInspect(args.slice(1), io, installer);
    case "install":
      return handleInstall(args.slice(1), io, installer, options);
    case "rollback":
      return handleRollback(args.slice(1), io, installer, options);
    default:
      io.stderr(`Unknown command: ${command}\n`);
      return 1;
  }
}

function handleSearch(args: string[], io: CliIO, installer: Installer): number {
  const query = args.join(" ");
  if (query.length === 0) {
    io.stderr("Usage: neuraforge search <query>\n");
    return 1;
  }

  const result = installer.search(query);
  if (!result.ok) {
    io.stderr(JSON.stringify(result.error, null, 2) + "\n");
    return 1;
  }

  io.stdout(JSON.stringify(result.value, null, 2) + "\n");
  return 0;
}

function handleInspect(args: string[], io: CliIO, installer: Installer): number {
  if (args.length < 2) {
    io.stderr("Usage: neuraforge inspect <stableId> <version>\n");
    return 1;
  }

  const stableId = args[0];
  const version = args[1];
  if (stableId === undefined || version === undefined) {
    io.stderr("Usage: neuraforge inspect <stableId> <version>\n");
    return 1;
  }

  const result = installer.inspect(stableId, version);
  if (!result.ok) {
    io.stderr(JSON.stringify(result.error, null, 2) + "\n");
    return 1;
  }

  io.stdout(JSON.stringify(result.value, null, 2) + "\n");
  return 0;
}

/** Flags that never take a value argument. */
const BOOLEAN_FLAGS = new Set(["preview", "yes"]);

function parseArgs(args: string[]): { positional: string[]; flags: Record<string, string | true> } {
  const positional: string[] = [];
  const flags: Record<string, string | true> = {};
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === undefined) break;
    if (arg.startsWith("--")) {
      const name = arg.slice(2);
      if (BOOLEAN_FLAGS.has(name)) {
        flags[name] = true;
        i += 1;
      } else {
        const next = args[i + 1];
        if (next !== undefined && !next.startsWith("--")) {
          flags[name] = next;
          i += 2;
        } else {
          flags[name] = true;
          i += 1;
        }
      }
    } else {
      positional.push(arg);
      i += 1;
    }
  }
  return { positional, flags };
}

async function handleInstall(
  args: string[],
  io: CliIO,
  installer: Installer,
  options?: CliOptions,
): Promise<number> {
  const { positional, flags } = parseArgs(args);

  const isPreview = flags.preview === true;
  const destination = typeof flags.destination === "string" ? flags.destination : undefined;
  const yesFlag = flags.yes === true;
  const planIdFlag = typeof flags["plan-id"] === "string" ? flags["plan-id"] : undefined;
  const approveFlag = typeof flags.approve === "string" ? flags.approve : undefined;

  if (positional.length < 2) {
    io.stderr("Usage: neuraforge install [--preview] <stableId> <version> --destination <path>\n");
    return 1;
  }

  if (!destination) {
    io.stderr("Error: --destination is required\n");
    return 1;
  }

  const stableId = positional[0];
  const version = positional[1];
  if (stableId === undefined || version === undefined) {
    io.stderr("Usage: neuraforge install [--preview] <stableId> <version> --destination <path>\n");
    return 1;
  }
  const approvedOverwritePaths = approveFlag ? approveFlag.split(",") : undefined;

  const request = {
    stableId,
    version,
    destination,
    approvedOverwritePaths,
  };

  if (!options?.target) {
    io.stderr("Error: target is required for install operations\n");
    return 1;
  }

  const target = options.target;

  // Always preview first
  const previewResult = await installer.preview(request, target);
  if (!previewResult.ok) {
    io.stderr(JSON.stringify(previewResult.error, null, 2) + "\n");
    return 1;
  }

  const plan = previewResult.value;

  if (isPreview) {
    io.stdout(JSON.stringify(plan, null, 2) + "\n");
    return 0;
  }

  // For non-preview install, require confirmation
  if (!yesFlag) {
    // Interactive confirmation
    io.stdout(JSON.stringify(plan, null, 2) + "\n");
    if (io.confirm) {
      const confirmed = await io.confirm();
      if (!confirmed) {
        io.stderr("Install cancelled by user\n");
        return 1;
      }
    } else {
      io.stderr("Error: interactive confirmation not available. Use --yes --plan-id <id>\n");
      return 1;
    }
  } else {
    // --yes requires --plan-id
    if (!planIdFlag) {
      io.stderr("Error: --yes requires --plan-id <planId>\n");
      return 1;
    }
    if (planIdFlag !== plan.planId) {
      io.stderr(`Error: --plan-id '${planIdFlag}' does not match computed plan '${plan.planId}'\n`);
      return 1;
    }
  }

  const confirmation = {
    confirmed: true as const,
    planId: plan.planId,
    planChecksum: plan.planChecksum,
    approvedOverwritePaths: request.approvedOverwritePaths,
  };

  const applyResult = await installer.apply(plan, confirmation, target);
  if (!applyResult.ok) {
    io.stderr(JSON.stringify(applyResult.error, null, 2) + "\n");
    return 1;
  }

  io.stdout(JSON.stringify(applyResult.value, null, 2) + "\n");
  return 0;
}

async function handleRollback(
  args: string[],
  io: CliIO,
  installer: Installer,
  options?: CliOptions,
): Promise<number> {
  if (args.length < 1) {
    io.stderr("Usage: neuraforge rollback <planId>\n");
    return 1;
  }

  if (!options?.target) {
    io.stderr("Error: target is required for rollback operations\n");
    return 1;
  }

  const planId = args[0];
  if (planId === undefined) {
    io.stderr("Usage: neuraforge rollback <planId>\n");
    return 1;
  }

  const result = await installer.rollback(planId, options.target);
  if (!result.ok) {
    io.stderr(JSON.stringify(result.error, null, 2) + "\n");
    return 1;
  }

  io.stdout(JSON.stringify(result.value, null, 2) + "\n");
  return result.value.success ? 0 : 1;
}
