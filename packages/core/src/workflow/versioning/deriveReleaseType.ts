// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { CommitClassifier, GitCommit, ReleaseType } from '#types'
import { determineReleaseType } from './determineReleaseType'
import { pickPriorityReleaseType } from './pickPriorityReleaseType'

/**
 * Derive the combined release type from a commit history collection.
 *
 * Processes commits sequentially, accumulating the highest-precedence release
 * type found by evaluating each individual commit and comparing it against the
 * current maximum via `pickPriorityReleaseType`.
 *
 * @param classifier Function mapping commits to release types
 * @param history Array of parsed commits to evaluate
 * @returns `ReleaseType` string, or `null` when no matching rule applies
 */
export function deriveReleaseType(
  classifier: CommitClassifier,
  history: readonly GitCommit[]
): ReleaseType | null {
  let releaseType: ReleaseType | null = null

  for (const commit of history) {
    releaseType = pickPriorityReleaseType(
      releaseType,
      determineReleaseType(classifier, commit)
    )
  }

  return releaseType
}
