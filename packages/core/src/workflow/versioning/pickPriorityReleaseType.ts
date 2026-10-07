// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { ReleaseType } from '#types'

/**
 * Determine the highest-priority release type between two candidates.
 *
 * Compares release types by precedence order: `major` > `minor` > `patch`.
 * Returns the higher-precedence type, or `null` if neither applies.
 *
 * @param curr Current accumulated release type
 * @param next Candidate release type to consider
 * @returns Highest-precedence `ReleaseType`, or `null` if neither applies
 */
export function pickPriorityReleaseType(
  curr: ReleaseType | null | undefined,
  next: ReleaseType | null | undefined
): ReleaseType | null {
  for (const type of ['major', 'minor', 'patch'] satisfies ReleaseType[]) {
    if (curr === type || next === type) {
      return type
    }
  }

  return null
}
