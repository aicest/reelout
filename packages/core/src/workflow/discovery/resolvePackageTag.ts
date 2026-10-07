// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { generateGitTagName, getGitTagMessage } from '#git'
import type { Package, Tag } from '#types'
import { verifyPackageTag } from './verifyPackageTag'

/**
 * Resolve the release tag for a single package version.
 *
 * Returns the cached `pkg.tag` immediately if it already exists. Generates an
 * expected tag name from the package metadata and verifies its integrity using
 * `verifyPackageTag`.
 *
 * @param cwd Repository working directory
 * @param pkg Package descriptor containing version and location context
 * @returns A promise resolving to the tag metadata or null when not found
 */
export async function resolvePackageTag(
  cwd: string,
  pkg: Package
): Promise<Tag | null> {
  if (pkg.tag) {
    return pkg.tag
  }

  let expectedTagName: string | null | undefined

  try {
    expectedTagName = generateGitTagName(pkg.entry, pkg.name, pkg.version)
  } catch {}

  if (!expectedTagName) {
    return null
  }

  if (await verifyPackageTag(cwd, pkg, expectedTagName)) {
    return {
      name: expectedTagName,
      message: await getGitTagMessage(cwd, expectedTagName),
    }
  }

  return null
}
