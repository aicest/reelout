// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type {
  CommitClassifier,
  GitCommit,
  ReleasePlan,
  ReleaseTypeHint,
} from '#types'
import { deriveReleaseType, pickPriorityReleaseType } from '../versioning'
import { isCommitForPackage } from './isCommitForPackage'

/**
 * Analyze commit history to update release plans for packages.
 *
 * Maps commit `history` across package release `plans` to associate matching
 * commits with their target packages. Calculates the release type for each
 * plan based on classified `history` and applies overrides according to the
 * provided `hint` or existing release priority.
 *
 * @param hint Release type override hint or default preference
 * @param classifier Classifier function to determine commit release types
 * @param plans List of release plans to analyze and update
 * @param history Stream or iterable of git commits to process
 * @returns Updated release plans with updated commit histories and release types
 */
export async function deriveChangeReleases(
  hint: ReleaseTypeHint,
  classifier: CommitClassifier,
  plans: readonly ReleasePlan[],
  history: Iterable<GitCommit> | AsyncIterable<GitCommit>
): Promise<ReleasePlan[]> {
  for await (const commit of history) {
    plans = plans.map((plan): ReleasePlan => {
      if (!isCommitForPackage(plan.package, commit)) {
        return plan
      }

      return {
        ...plan,
        history: plan.history.concat(commit),
      }
    })
  }

  return plans.map((plan): ReleasePlan => {
    let { release } = plan

    let releaseType = deriveReleaseType(classifier, plan.history)

    if (releaseType) {
      switch (hint) {
        case 'major':
        case 'minor':
        case 'patch':
          releaseType = hint
          break
        default:
          releaseType = pickPriorityReleaseType(release?.type, releaseType)
          break
      }
    }

    if (releaseType) {
      release = {
        ...release,
        type: releaseType,
      }
    }

    return {
      ...plan,
      release,
    }
  })
}
