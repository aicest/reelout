// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import semver from 'semver'

/**
 * Determine whether two semantic version strings or objects belong to the same release cycle.
 *
 * Compares the main version components of `currentVersion` and `nextVersion` to
 * determine equality. Treats a transition from a non-zero `0.x` version to
 * `1.0.0` as part of the same release cycle. Returns `false` if either input
 * cannot be parsed.
 *
 * @param currentVersion Starting version string, `semver.SemVer` instance, or nullish value
 * @param nextVersion Target version string, `semver.SemVer` instance, or nullish value
 * @returns `true` if both versions belong to the same release cycle, `false` otherwise
 */
export function isSameReleaseCycle(
  currentVersion: string | semver.SemVer | null | undefined,
  nextVersion: string | semver.SemVer | null | undefined
): boolean {
  const current = semver.parse(currentVersion)
  const next = semver.parse(nextVersion)

  if (!current || !next) return false

  if (current.compareMain(next) === 0) return true

  return (
    current.major === 0 &&
    (current.minor > 0 || current.patch > 0) &&
    next.major === 1 &&
    next.minor === 0 &&
    next.patch === 0
  )
}
