// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit } from '#util'

/**
 * Get the tag name that exactly matches the current `HEAD`, if any.
 *
 * @param cwd Repository working directory
 * @returns Tag name or `null` when no exact tag matches HEAD
 */
export async function getCurrentGitTag(cwd: string): Promise<string | null> {
  try {
    const stdout = await execGit(cwd, ['describe', '--tags', '--exact-match'])

    const tag = stdout.trim()

    /* istanbul ignore next */
    return tag ? tag : null
  } catch {
    return null
  }
}
