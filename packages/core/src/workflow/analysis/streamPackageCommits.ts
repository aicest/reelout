// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { showParsedGitHistory, type ShowGitHistoryOptions } from '#git'
import type { GitCommit, Package } from '#types'
import { isCommitForPackage } from './isCommitForPackage'

/**
 * Yield commits from git history associated with a package.
 *
 * Filters git commit history to stream only entries relevant to the target
 * `pkg` directory.
 *
 * @param cwd Path to the working directory for git commands
 * @param pkg Package configuration containing the target directory
 * @param options Options for parsing and filtering git history
 * @yields Commits belonging to the specified package
 */
export async function* streamPackageCommits(
  cwd: string,
  pkg: Package,
  options: ShowGitHistoryOptions = {}
): AsyncGenerator<GitCommit> {
  options = {
    ...options,
    filePath: options.filePath || pkg.location,
  }

  for await (const commit of showParsedGitHistory(cwd, options)) {
    if (isCommitForPackage(pkg, commit)) {
      yield commit
    }
  }
}
