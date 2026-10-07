// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit } from '#util'

/**
 * Count mainline commits reachable from a given reference.
 *
 * Uses `git rev-list --count --first-parent` to calculate the length of the
 * primary history trunk, excluding commits introduced by side-branch merges.
 *
 * @param cwd Repository working directory
 * @param ref Commit reference to count from (defaults to `HEAD`)
 * @returns Number of commits along the primary branch line up to `ref`
 */
export async function countGitHistory(
  cwd: string,
  ref: string = 'HEAD'
): Promise<number> {
  const stdout = await execGit(cwd, [
    'rev-list',
    '--count',
    '--first-parent',
    ref,
  ])

  return Number.parseInt(stdout.trim(), 10)
}
