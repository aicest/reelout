// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { colors } from 'consola/utils'
import semver from 'semver'

/**
 * Determine whether a version string represents a stable SemVer release.
 *
 * A version is considered stable when:
 * - It is a valid SemVer string.
 * - Its major version is greater than 0 (not 0.x.x).
 * - It contains no prerelease identifiers (no `-alpha`, `-beta`, `-rc`, etc.).
 *
 * Build metadata (the `+` suffix) does not affect stability.
 *
 * @param version Semantic version string to check
 * @returns `true` if `version` is a stable SemVer; otherwise `false`
 * @throws If `version` is not a valid SemVer string
 */
export function isStableVersion(version: string): boolean {
  const parsed = semver.parse(version)

  if (!parsed) {
    throw new Error(
      `The version "${colors.bold(version)}" is not a valid SemVer.`
    )
  }

  return parsed.major > 0 && parsed.prerelease.length === 0
}
