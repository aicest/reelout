// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit } from '#util'

/**
 * Delete a local git tag in the repository at `cwd`.
 *
 * @param cwd Repository working directory
 * @param tag Tag name to delete
 * @returns `true` when deletion succeeded, otherwise `false`
 */
export function deleteGitTag(cwd: string, tag: string): Promise<boolean> {
  return execGit(cwd, ['tag', '-d', tag])
    .then(() => true)
    .catch(() => false)
}
