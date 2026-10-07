// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit } from '#util'
import { resolveGitRevision } from '../revision/resolveGitRevision'
import {
  expandGitHistory,
  type ExpandGitHistoryOptions,
} from './expandGitHistory'

export interface ShowGitHistoryOptions extends ExpandGitHistoryOptions {
  filePath?: string | readonly string[] | undefined
}

/**
 * Yield commit SHAs from repository history in paginated order.
 *
 * Ensures commits are available via `expandGitHistory`, resolves `until` to a
 * commit id, and pages from `from` toward `until`, yielding each commit SHA.
 * If a git command fails the generator ends silently.
 *
 * @param cwd Repository working directory
 * @param options Supports `from`, `until`, `pageSize`, and `filePath`
 * @yields Commit SHA strings in paginated order
 */
export async function* showGitHistory(
  cwd: string,
  options: ShowGitHistoryOptions = {}
): AsyncGenerator<string> {
  try {
    const { filePath, pageSize = 50 } = options
    let from = options.from || 'HEAD'
    let until = options.until || undefined

    if (until) {
      until = await resolveGitRevision(cwd, until)
    }

    while (true) {
      await expandGitHistory(cwd, { from, until, pageSize })

      const args = ['rev-list', `--max-count=${pageSize}`, from]

      if (until) {
        args.push(`^${until}`)
      }

      if (filePath) {
        args.push(
          '--',
          ...(Array.isArray(filePath) ? filePath : [filePath]).filter(Boolean)
        )
      }

      const stdout = await execGit(cwd, args)

      const list = stdout.trim().split('\n').filter(Boolean)

      for (const item of list.slice(0, -1)) {
        yield item
      }

      const tail = list.at(-1)

      if (!tail) {
        return
      }

      if (tail === from) {
        yield tail

        from = `${tail}^`

        from = await resolveGitRevision(cwd, from)
      } else {
        from = tail
      }
    }
  } catch {}
}
