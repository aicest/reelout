// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { colors } from 'consola/utils'
import semver from 'semver'
import { iterateChangelogVersions } from './iterateChangelogVersions'

// TODO: remove unused
/**
 * Find the latest stable version that precedes the current version.
 *
 * Parses markdown from top to bottom to extract semantic versions from headings
 * and paragraphs. Enforces that discovered versions appear in strict
 * descending order. Returns the first version that falls outside the current
 * version's major, minor, and patch boundaries if the current version is
 * `v1.0.0` or higher, or the first non-matching version for `v0.x.x` releases.
 *
 * @param currentVersion The version to evaluate against
 * @param changelogContent The raw markdown content to scan for versions
 * @returns The resolved stable version string or null when none is found
 * @throws If `currentVersion` is invalid or already stable, or if versions in the changelog are not listed in strict descending order
 */
export async function extractPreviousVersion(
  currentVersion: string | null | undefined,
  changelogContent: string
): Promise<string | null> {
  const parsedCurrent = semver.parse(currentVersion)

  if (!currentVersion || !parsedCurrent) {
    throw new Error(
      `The current version "${colors.bold(String(currentVersion))}" is not a valid semantic version.`
    )
  }

  const currentMajor = parsedCurrent.major

  if (currentMajor >= 1 && parsedCurrent.prerelease.length === 0) {
    throw new Error(
      `The current version "${colors.bold(currentVersion)}" is already a stable release.`
    )
  }

  const baseVersion = `${parsedCurrent.major}.${parsedCurrent.minor}.${parsedCurrent.patch}`

  let priorVersion: semver.SemVer | null = null

  for (const version of iterateChangelogVersions(changelogContent)) {
    const parsedVersion = semver.parse(version)

    /* istanbul ignore else */
    if (parsedVersion) {
      if (!priorVersion) {
        if (version !== currentVersion) {
          return version
        }

        priorVersion = parsedVersion
      } else {
        if (semver.gte(parsedVersion, priorVersion)) {
          throw new Error(
            `Each newer release must have a higher version, but "${colors.bold(priorVersion.version)}" appears before "${colors.bold(version)}".`
          )
        }

        priorVersion = parsedVersion

        const { major, minor, patch } = parsedVersion

        if (currentMajor >= 1 && `${major}.${minor}.${patch}` !== baseVersion) {
          return version
        }
      }
    }
  }

  return null
}
