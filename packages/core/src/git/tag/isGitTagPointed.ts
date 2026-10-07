// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit } from '#util'

/**
 * Check whether a given tag points to the provided commit.
 *
 * @param cwd Repository working directory
 * @param tag Tag name to resolve
 * @param commit Commit hash to compare against
 * @returns `true` when the tag points at `commit`, otherwise `false`
 */
export async function isGitTagPointed(
  cwd: string,
  tag: string,
  commit: string
): Promise<boolean> {
  try {
    await execGit(cwd, [
      'merge-base',
      '--is-ancestor',
      `refs/tags/${tag}^{commit}`,
      commit,
    ])

    await execGit(cwd, [
      'merge-base',
      '--is-ancestor',
      commit,
      `refs/tags/${tag}^{commit}`,
    ])

    return true
  } catch {
    return false
  }
}
