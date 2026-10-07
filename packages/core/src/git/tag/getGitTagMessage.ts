// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit } from '#util'

/**
 * Get the message of an annotated git tag in the repository at `cwd`.
 *
 * @param cwd Repository working directory
 * @param tag Tag name to query
 * @returns The tag message string when found, otherwise `undefined`
 */
export async function getGitTagMessage(
  cwd: string,
  tag: string
): Promise<string | undefined> {
  try {
    const stdout = await execGit(cwd, [
      'for-each-ref',
      '--format=%(objecttype)%00%(contents)',
      `refs/tags/${tag}`,
    ])

    const [objectType, message] = stdout.split('\0')

    if (objectType?.trim() !== 'tag') {
      return undefined
    }

    return message?.trim() || undefined
  } catch {
    /* istanbul ignore next */
    return undefined
  }
}
