// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { ReleasePlan, ReleaseType } from '#types'
import semver from 'semver'

// TODO: remove unused
/**
 * Promote prerelease versions when they have no explicit release type.
 *
 * Analyzes prerelease and zero-major versions to determine an appropriate
 * release type for graduation:
 * - Prerelease versions are promoted based on their highest incremented component
 *   (patch, minor, or major)
 * - Zero-major versions (0.y.z) are promoted to major
 * - Stable versions (1.0.0+) remain unchanged
 * - Plans with explicit releases are preserved as-is
 *
 * @param plans Release plans to analyze
 * @returns Plans with inferred release types for prerelease versions
 */
export async function promotePrereleaseVersions(
  plans: readonly ReleasePlan[]
): Promise<ReleasePlan[]> {
  return plans.map((plan): ReleasePlan => {
    if (plan.release) return plan

    if (!plan.package.tag) return plan

    const parsed = semver.parse(plan.package.version)

    if (!parsed) return plan

    let type: ReleaseType | undefined

    if (parsed.prerelease.length) {
      if (parsed.patch !== 0) type = 'patch'
      else if (parsed.minor !== 0) type = 'minor'
      else if (parsed.major !== 0) type = 'major'
      else type = 'major'
    } else if (parsed.major === 0) {
      type = 'major'
    }

    if (type) {
      return { ...plan, release: { type } }
    }

    return plan
  })
}
