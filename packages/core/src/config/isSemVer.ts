// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import semver from 'semver'

/**
 * Determine whether a value is a valid Semantic Versioning string.
 *
 * Rejects non-string values, leading or trailing whitespace, and leading `v`
 * prefixes. Validates the candidate string using `semver.parse`.
 *
 * @param version Candidate value to evaluate for SemVer compliance
 * @returns `true` if `version` is a valid SemVer string, or `false` otherwise
 */
export function isSemVer(
  version: string | null | undefined
): version is string {
  if (typeof version !== 'string') {
    return false
  }

  if (version !== version.trim()) {
    return false
  }

  if (version.startsWith('v')) {
    return false
  }

  return semver.parse(version) != null
}
