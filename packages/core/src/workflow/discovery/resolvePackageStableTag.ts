// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { DEFAULT_CHANGELOG_FILE } from '#config'
import { generateGitTagName, getGitTagMessage } from '#git'
import type { Package, Tag } from '#types'
import assert from 'node:assert'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import semver from 'semver'
import { iterateChangelogVersions } from '../changelog/iterateChangelogVersions'
import { verifyPackageTag } from './verifyPackageTag'

/**
 * Resolve the latest stable Git tag for a package.
 *
 * Reads changelog release versions for `pkg` and verifies strict descending
 * semver order. Ignores prerelease versions unless transitioning across major
 * or prerelease boundaries, and verifies that the matching Git tag exists.
 *
 * @param cwd Absolute path to the root working directory
 * @param pkg Package configuration object
 * @returns Verified tag metadata object or `null` if no stable tag is resolved
 * @throws If a version is invalid, versions are not in strict descending
 * order, or the corresponding Git tag is missing
 */
export async function resolvePackageStableTag(
  cwd: string,
  pkg: Package
): Promise<Tag | null> {
  const changelogFile = pkg.changelogFile || DEFAULT_CHANGELOG_FILE

  const changelogFilePath = path.resolve(cwd, pkg.location, changelogFile)

  let changelogContent: string

  try {
    changelogContent = await readFile(changelogFilePath, 'utf-8')
  } catch (error: unknown) {
    /* istanbul ignore else */
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return null
    }

    /* istanbul ignore next */
    throw error
  }

  let precedingVersion: semver.SemVer | null = null

  for (const version of iterateChangelogVersions(changelogContent)) {
    const currentVersion = semver.parse(version)

    assert(
      currentVersion,
      `Version "${version}" is not a valid semantic version.`
    )

    if (precedingVersion && semver.gte(currentVersion, precedingVersion)) {
      throw new Error(
        `Version "${version}" must be strictly lower than preceding version "${precedingVersion.raw}".`
      )
    }

    if (
      !semver.prerelease(currentVersion) &&
      (currentVersion.major >= 1 ||
        (precedingVersion && semver.prerelease(precedingVersion)))
    ) {
      const tagName = generateGitTagName(pkg.entry, pkg.name, version)

      if (!(await verifyPackageTag(cwd, pkg, tagName))) {
        throw new Error(
          `Git tag "${tagName}" is not associated with package "${pkg.name ?? ''}" in directory "${pkg.location}".`
        )
      }

      return {
        name: tagName,
        message: await getGitTagMessage(cwd, tagName),
      }
    }

    precedingVersion = currentVersion
  }

  return null
}
