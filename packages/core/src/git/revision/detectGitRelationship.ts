// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { isGitAncestor } from './isGitAncestor'

export const GIT_REL_FLAGS = {
  NONE: 0,
  IS_ANCESTOR: 1,
  IS_DESCENDANT: 2,
  IS_EQUAL: 3,
} as const

export type GitRelFlags = (typeof GIT_REL_FLAGS)[keyof typeof GIT_REL_FLAGS]

/**
 * Determine the relationship between two git refs.
 *
 * Runs `git merge-base --is-ancestor` in both directions and returns a
 * numeric bitmask using `GIT_REL_FLAGS`. A successful check (exit code 0)
 * indicates an ancestor relationship; non-zero exit is treated as "not ancestor".
 *
 * @param cwd Repository working directory
 * @param refA First ref (candidate ancestor)
 * @param refB Second ref (candidate descendant)
 * @returns Bitmask of type `GitRelFlags`
 */
export async function detectGitRelationship(
  cwd: string,
  refA: string,
  refB: string
): Promise<GitRelFlags> {
  let flags = GIT_REL_FLAGS.NONE

  const [aIsAncestor, bIsAncestor] = await Promise.all([
    isGitAncestor(cwd, refA, refB),
    isGitAncestor(cwd, refB, refA),
  ])

  if (aIsAncestor) flags |= GIT_REL_FLAGS.IS_ANCESTOR
  if (bIsAncestor) flags |= GIT_REL_FLAGS.IS_DESCENDANT

  return flags as GitRelFlags
}
