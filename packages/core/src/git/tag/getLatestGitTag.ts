// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit } from '#util'

/**
 * Get the most recent tag reachable from `HEAD`.
 *
 * @param cwd Repository working directory
 * @returns Latest tag string or `null` when none is found
 */
export async function getLatestGitTag(cwd: string): Promise<string | null> {
  try {
    const stdout = await execGit(cwd, ['describe', '--tags', '--abbrev=0'])
    const tag = stdout.trim()

    /* istanbul ignore next */
    return tag ? tag : null
  } catch {
    return null
  }
}
