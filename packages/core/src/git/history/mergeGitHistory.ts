// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { GitCommit } from '#types'
import {
  detectGitRelationship,
  GIT_REL_FLAGS,
} from '../revision/detectGitRelationship'

/**
 * Merge two newest-first commit lists into a single deduplicated newest-first list.
 *
 * Compares commits by hash, uses git relationship (ancestor/descendant) when needed,
 * and falls back to committerDate for unrelated commits.
 *
 * @param cwd Repository working directory used for relationship checks
 * @param a Commits from the first source (newest-first)
 * @param b Commits from the second source (newest-first)
 * @returns Merged commits in newest-first order with duplicates removed
 */
export async function mergeGitHistory(
  cwd: string,
  a: readonly GitCommit[],
  b: readonly GitCommit[]
): Promise<GitCommit[]> {
  const merged: GitCommit[] = []
  const a2 = [...a]
  const b2 = [...b]
  let i = a2.shift()
  let j = b2.shift()

  while (i && j) {
    const rel =
      i.hash === j.hash
        ? GIT_REL_FLAGS.IS_EQUAL
        : await detectGitRelationship(cwd, i.hash, j.hash)

    switch (rel) {
      case GIT_REL_FLAGS.IS_EQUAL:
        merged.push(i)
        i = a2.shift()
        j = b2.shift()
        break

      case GIT_REL_FLAGS.IS_ANCESTOR:
        merged.push(j)
        j = b2.shift()
        break

      case GIT_REL_FLAGS.IS_DESCENDANT:
        merged.push(i)
        i = a2.shift()
        break

      case GIT_REL_FLAGS.NONE:
        if (i.committerDate < j.committerDate) {
          merged.push(j)
          j = b2.shift()
        } else {
          merged.push(i)
          i = a2.shift()
        }
        break
    }
  }

  if (i) {
    merged.push(i)
  }

  if (j) {
    merged.push(j)
  }

  return merged.concat(a2).concat(b2)
}
