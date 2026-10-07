// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit } from '#util'

/**
 * Determine whether the repository at `cwd` is a shallow clone.
 *
 * Runs `git rev-parse --is-shallow-repository` to detect shallow clones.
 * Useful before operations that require full history.
 *
 * @param cwd Repository working directory
 * @returns `true` if shallow, `false` if full clone, or `null` on error
 */
export async function isGitShallowRepository(cwd: string): Promise<boolean> {
  const stdout = (
    await execGit(cwd, ['rev-parse', '--is-shallow-repository'])
  ).trim()

  return stdout === 'true'
}
