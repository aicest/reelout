// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit } from '#util'

/**
 * Resolve a Git revision or commit-ish expression to its full commit hash.
 *
 * Runs `git rev-parse --verify <revision>^{commit}` under the hood. Peels annotated
 * tags, branches, short SHAs, and relative expressions down to a verified commit object.
 *
 * @param cwd The repository working directory
 * @param revision The Git revision or expression to resolve
 * @returns A promise that resolves to the full, trimmed commit SHA-1 string
 */
export async function resolveGitRevision(
  cwd: string,
  revision: string
): Promise<string> {
  return (
    await execGit(cwd, ['rev-parse', '--verify', `${revision}^{commit}`])
  ).trim()
}
