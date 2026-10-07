// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { CommitClassifier, GitCommit, ReleaseType } from '#types'

/**
 * Determine the release type for a single commit.
 *
 * Automatically returns `'major'` if the commit is marked as a breaking change.
 * Otherwise, routes the commit through the custom `classifier` and ensures the
 * resolved value is a valid semantic versioning release type.
 *
 * @param classifier Function mapping commits to release types
 * @param commit Parsed commit to evaluate
 * @returns `ReleaseType` string, or `null` when no matching rule applies
 */
export function determineReleaseType(
  classifier: CommitClassifier,
  commit: GitCommit
): ReleaseType | null {
  if (commit.notes.length > 0) {
    return 'major'
  }

  const type = classifier(commit)

  switch (type) {
    case 'major':
    case 'minor':
    case 'patch':
      return type
  }

  return null
}
