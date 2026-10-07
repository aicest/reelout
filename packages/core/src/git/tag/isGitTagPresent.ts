// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { resolveGitRevision } from '../revision/resolveGitRevision'

/**
 * Determine whether a specific git tag exists locally in the repository.
 *
 * @param cwd Working directory for the git command
 * @param tag Name of the tag to evaluate
 * @returns True if the tag reference exists locally, false otherwise
 */
export function isGitTagPresent(cwd: string, tag: string): Promise<boolean> {
  return resolveGitRevision(cwd, `refs/tags/${tag}`)
    .then(() => true)
    .catch(() => false)
}
