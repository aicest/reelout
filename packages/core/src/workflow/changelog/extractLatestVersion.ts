// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { iterateChangelogVersions } from './iterateChangelogVersions'

/**
 * Find the highest semantic version from the first version-bearing element.
 *
 * Pulls the first available version string from the parsed markdown iterator.
 * Short-circuits execution immediately upon locating a match to avoid passing
 * through the remaining document structure.
 *
 * @param changelogContent The raw markdown string representing the changelog
 * @returns The highest valid semantic version string found or null
 */
export function extractLatestVersion(changelogContent: string): string | null {
  for (const version of iterateChangelogVersions(changelogContent)) {
    return version
  }

  return null
}
