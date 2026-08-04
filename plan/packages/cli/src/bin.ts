#!/usr/bin/env node
/**
 * NeuraForge CLI entry point.
 *
 * This file is the bin target. It sets up the real environment and delegates
 * to runCli for testability.
 */

export { runCli } from "./cli.js";
export type { CliIO, CliOptions } from "./cli.js";
