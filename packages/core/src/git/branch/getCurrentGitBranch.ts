// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit } from '#util'

/**
 * Get the current Git branch name.
 *
 * Uses `execGit` to run `git symbolic-ref -q --short HEAD` in the provided
 * working directory and trims the result. Returns an empty string when the
 * repository is in a detached HEAD state.
 *
 * @param cwd The working directory to run the Git command in
 * @returns The current branch name as a string
 */
export async function getCurrentGitBranch(cwd: string): Promise<string> {
  return (await execGit(cwd, ['symbolic-ref', '-q', '--short', 'HEAD'])).trim()
}
