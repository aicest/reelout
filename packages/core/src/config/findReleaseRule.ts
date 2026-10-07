// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { GitRef, ResolvedReleaseRule } from '#types'
import { isMatch } from '#util'

/**
 * Find the first release rule matching a release reference.
 *
 * Matches rules sequentially against the reference type and pattern.
 *
 * @param ref Release reference object
 * @param rules Array of release rules to match against
 * @returns The first matching release rule or `undefined`
 */
export function findReleaseRule(
  ref: GitRef,
  rules: readonly ResolvedReleaseRule[]
): ResolvedReleaseRule | undefined {
  return rules.find((rule) => {
    return (
      (rule.type == null || rule.type === ref.type) &&
      isMatch(ref.name, rule.pattern)
    )
  })
}
