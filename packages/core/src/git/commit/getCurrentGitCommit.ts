// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { GitCommit } from '#types'
import { getParsedGitCommit } from './getParsedGitCommit'

/**
 * Resolve the current `HEAD` commit in the repository.
 *
 * @param cwd Repository working directory path
 * @param markers Optional array of custom trailer marker strings
 * @returns Parsed commit object for the current `HEAD` commit
 */
export function getCurrentGitCommit(
  cwd: string,
  markers: readonly string[] = []
): Promise<GitCommit> {
  return getParsedGitCommit(cwd, 'HEAD', markers)
}
