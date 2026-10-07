// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit } from '#util'
import { countGitHistory } from '../history/countGitHistory'
import { withShallowLock } from '../repository/withShallowLock'
import { deleteGitTag } from './deleteGitTag'
import { isGitTagPresent } from './isGitTagPresent'

const MIN_HISTORY_DEPTH = 2
const ORIGIN_NOT_REPO = `fatal: 'origin' does not appear to be a git repository`
const REMOTE_REF_NOT_FOUND = `fatal: couldn't find remote ref`

/**
 * Ensure a tag exists locally, fetching it shallowly from `origin` if needed.
 *
 * Acquires a shallow-fetch lock, verifies local presence and history depth,
 * attempts a shallow fetch of `refs/tags/<tag>` when required, and removes a
 * local tag if the remote reports the tag is missing.
 *
 * @param cwd Working directory
 * @param tag Tag name (for example `v1.2.0`)
 * @returns `true` if the tag is present or was fetched; otherwise `false`
 */
export function ensureGitTag(cwd: string, tag: string): Promise<boolean> {
  return withShallowLock(cwd, async () => {
    const tagRef = `refs/tags/${tag}`

    if (
      (await isGitTagPresent(cwd, tag)) &&
      (await countGitHistory(cwd, tagRef)) >= MIN_HISTORY_DEPTH
    ) {
      return true
    }

    try {
      await execGit(cwd, [
        'fetch',
        'origin',
        `${tagRef}:${tagRef}`,
        `--depth=${MIN_HISTORY_DEPTH}`,
        '--update-shallow',
        '--force',
      ])

      return true
    } catch (err) {
      const errorMessage = (err as Error | undefined)?.message

      if (errorMessage?.includes(ORIGIN_NOT_REPO)) {
        return await isGitTagPresent(cwd, tag)
      }

      if (errorMessage?.includes(REMOTE_REF_NOT_FOUND)) {
        if (await isGitTagPresent(cwd, tag)) {
          await deleteGitTag(cwd, tag)
        }
      }
    }

    return false
  })
}
