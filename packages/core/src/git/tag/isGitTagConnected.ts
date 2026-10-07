// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit } from '#util'

/**
 * Determine whether a specific git tag commit is reachable from the current HEAD.
 *
 * Uses `git merge-base --is-ancestor refs/tags/<tag>^{commit} HEAD` to verify
 * that the tag's commit is an ancestor of the current reference. Any non-zero
 * exit status or execution error is treated as "not reachable".
 *
 * @param cwd Working directory where the git command will run
 * @param tag Tag name to evaluate (for example, "v1.2.0")
 * @returns True if the tag commit is reachable from HEAD, false otherwise
 */
export async function isGitTagConnected(
  cwd: string,
  tag: string
): Promise<boolean> {
  try {
    await execGit(cwd, [
      'merge-base',
      '--is-ancestor',
      `refs/tags/${tag}^{commit}`,
      'HEAD',
    ])

    return true
  } catch {
    return false
  }
}
