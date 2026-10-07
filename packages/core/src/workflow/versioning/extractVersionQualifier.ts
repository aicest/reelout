// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type semver from 'semver'

/**
 * Extract the version qualifier string from a parsed `SemVer` instance.
 *
 * Strips the trailing numeric counter from the `prerelease` components if
 * present. Joins any remaining prerelease identifiers with a dot separator.
 *
 * @param version Parsed `SemVer` instance or nullish value to inspect
 * @returns The extracted qualifier string or `undefined` if no prerelease exists
 */
export function extractVersionQualifier(
  version: semver.SemVer | null | undefined
): string | undefined {
  if (version != null && version.prerelease.length > 0) {
    const prerelease = [...version.prerelease]

    if (typeof prerelease.at(-1) === 'number') {
      prerelease.pop()
    }

    return prerelease.join('.')
  } else {
    return undefined
  }
}
