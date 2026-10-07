// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import {
  ensureGitTag,
  expandGitHistory,
  getParsedGitCommit,
  isGitTagConnected,
} from '#git'
import type { GitCommit, Package } from '#types'
import { isCommitForPackage } from '../analysis/isCommitForPackage'

/**
 * Verify a Git tag against package specifications and repository history.
 *
 * Ensures the target tag exists locally before parsing its commit data. Rejects
 * tags that do not target a commit matching the specified `pkg`. Expands the
 * history graph up to the tag reference before verifying structural connectivity.
 *
 * @param cwd Repository working directory path
 * @param pkg Package descriptor containing version and location context
 * @param tagName Name of the Git tag to verify
 * @returns True if the tag is valid and connected; otherwise, false
 */
export async function verifyPackageTag(
  cwd: string,
  pkg: Package,
  tagName: string
): Promise<boolean> {
  await ensureGitTag(cwd, tagName)

  const tagRef = `refs/tags/${tagName}`

  let tagCommit: GitCommit

  try {
    tagCommit = await getParsedGitCommit(cwd, tagRef)
  } catch {
    return false
  }

  if (!isCommitForPackage(pkg, tagCommit)) {
    return false
  }

  await expandGitHistory(cwd, { until: tagRef })

  return isGitTagConnected(cwd, tagName)
}
