// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { DEFAULT_CHANGELOG_FILE } from '#config'
import {
  generateGitTagName,
  getGitTagMessage,
  readGitFile,
  resolveGitRevision,
} from '#git'
import type { Package, Tag } from '#types'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { extractLatestVersion } from '../changelog/extractLatestVersion'
import { verifyPackageTag } from './verifyPackageTag'

/**
 * Discover and validate the Git tag for a package.
 *
 * Returns the existing tag if already present on the `pkg` object. Resolves
 * the local changelog file path, extracts the current version, and generates
 * the expected Git tag name. Verifies the tag against the repository and
 * ensures its historical changelog version matches the current local version.
 *
 * @param cwd The current working directory
 * @param pkg The package configuration object
 * @returns The validated `Tag` object or null if validation fails
 */
export async function discoverPackageTag(
  cwd: string,
  pkg: Package
): Promise<Tag | null> {
  if (pkg.tag) {
    return pkg.tag
  }

  const changelogFile = pkg.changelogFile || DEFAULT_CHANGELOG_FILE

  const changelogFilePath = path.resolve(cwd, pkg.location, changelogFile)

  let localChangelogContent: string | null | undefined

  try {
    localChangelogContent = await readFile(changelogFilePath, 'utf-8')
  } catch {}

  if (!localChangelogContent) {
    return null
  }

  const currentVersion = extractLatestVersion(localChangelogContent)

  if (!currentVersion) {
    return null
  }

  let expectedTagName: string | null | undefined

  try {
    expectedTagName = generateGitTagName(pkg.entry, pkg.name, currentVersion)
  } catch {}

  if (!expectedTagName) {
    return null
  }

  if (!(await verifyPackageTag(cwd, pkg, expectedTagName))) {
    return null
  }

  const tagRef = `refs/tags/${expectedTagName}`

  const historicalChangelogContent = await readGitFile(
    cwd,
    await resolveGitRevision(cwd, tagRef),
    path.relative(cwd, changelogFilePath)
  )

  if (!historicalChangelogContent) {
    return null
  }

  const historicalChangelogVersion = extractLatestVersion(
    historicalChangelogContent
  )

  if (
    !historicalChangelogVersion ||
    historicalChangelogVersion !== currentVersion
  ) {
    return null
  }

  return {
    name: expectedTagName,
    message: await getGitTagMessage(cwd, expectedTagName),
  }
}
