// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { CommitClassifier, ReleaseConfig, ReleaseType } from '#types'

/**
 * Normalize a commit classifier into a consistent function.
 *
 * Accepts `null`/`undefined` (returns no-op classifier), a function classifier,
 * or a config object mapping commit types to release types. Returns a classifier
 * function that maps commits to their corresponding release types.
 *
 * @param classifier Commit classifier config, function, or falsy value
 * @returns Normalized classifier function
 */
export function normalizeCommitFilter(
  classifier: ReleaseConfig['classifier'] | null | undefined
): CommitClassifier {
  if (classifier == null) {
    return () => null
  }

  if (typeof classifier === 'function') {
    return classifier
  }

  const map = new Map(
    Object.entries(classifier).flatMap(([releaseType, commitTypes]) => {
      return commitTypes.map((commitType) => [
        commitType,
        releaseType as ReleaseType,
      ])
    })
  )

  return (commit) => (commit.type ? map.get(commit.type) : null)
}
