// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { ALL_FILES } from '#config'
import type { GitCommit, Package } from '#types'
import { isMatch } from '#util'
import path from 'node:path'

/**
 * Test whether a commit modifies files in a package.
 *
 * @param pkg Package with an explicit file pattern or base directory
 * @param commit Parsed commit containing changed file paths
 * @returns `true` if any changed file matches the package pattern
 */
export function isCommitForPackage(pkg: Package, commit: GitCommit): boolean {
  return commit.files.some((file) => {
    const { location } = pkg
    const files = pkg.files || path.join(location, ALL_FILES)

    return isMatch(file, files)
  })
}
