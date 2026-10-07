// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit } from '#util'

/**
 * Convert a shallow clone into a full clone by fetching additional history.
 *
 * Runs `git fetch --unshallow`. Returns `true` when the operation succeeds
 * and `false` on error.
 *
 * @param cwd Repository working directory
 * @returns `true` when the operation succeeded, otherwise `false`
 */
export function restoreFullGitHistory(cwd: string): Promise<boolean> {
  return execGit(cwd, ['fetch', '--unshallow'])
    .then(() => true)
    .catch(() => false)
}
