// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit } from '#util'

/**
 * Determine whether `ancestor` is an ancestor of `descendant`.
 *
 * Runs `git merge-base --is-ancestor <ancestor> <descendant>` in the repository at `cwd`.
 * Resolves to `true` if `ancestor` is an ancestor, `false` if not.
 * Rethrows errors for invalid refs or other failures.
 *
 * @param cwd Repository working directory
 * @param ancestor Candidate ancestor ref
 * @param descendant Candidate descendant ref
 * @returns Resolves to `true` if `ancestor` is an ancestor of `descendant`, `false` otherwise
 * @throws If a ref is invalid or the Git command fails
 */
export function isGitAncestor(
  cwd: string,
  ancestor: string,
  descendant: string
): Promise<boolean> {
  return execGit(cwd, ['merge-base', '--is-ancestor', ancestor, descendant])
    .then(() => true)
    .catch((err) => {
      if ((err as { code?: number })?.code === 1) {
        return false
      }

      throw err
    })
}
