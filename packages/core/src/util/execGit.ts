// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import {
  execCommand,
  type ExecCommandOptions,
  type PromiseWithChild,
} from './execCommand'

/**
 * Execute a Git command inside a target directory.
 *
 * Wraps `execCommand` to invoke the `git` executable using the provided
 * arguments and execution options.
 *
 * @param cwd Working directory path where the Git command runs
 * @param args Command-line arguments passed to Git
 * @param options Additional execution, environment, and stream options
 * @returns Promise attached to the child process resolving to stdout
 */
export function execGit(
  cwd: string,
  args: readonly string[],
  options?: Partial<ExecCommandOptions>
): PromiseWithChild<string> {
  return execCommand('git', args, { ...options, cwd })
}
