// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit } from '#util'
import { isGitShallowRepository } from '../repository/isGitShallowRepository'
import { withShallowLock } from '../repository/withShallowLock'
import { isGitAncestor } from '../revision/isGitAncestor'
import { resolveGitRevision } from '../revision/resolveGitRevision'
import { countGitHistory } from './countGitHistory'

export interface ExpandGitHistoryOptions {
  /**
   * Number of commits to deepen the history by when paging
   * @default 50
   */
  pageSize?: number | undefined

  /**
   * Local reference used to measure current shallow depth (for example HEAD)
   * When provided the function accounts for existing depth before fetching more
   */
  from?: string | null | undefined

  /**
   * Target boundary reference where history deepening should stop
   * If provided the function will first attempt a single fetch to reach this commit
   */
  until?: string | null | undefined
}

/**
 * Deepen a shallow clone so additional commits become available.
 *
 * Attempts a single `--shallow-since` fetch to reach `until` (if provided),
 * otherwise deepens by `pageSize`, accounting for existing depth when `from`
 * is supplied. Operation is serialized to avoid concurrent deepens.
 *
 * @param cwd Repository working directory
 * @param options Options: { pageSize?, from?, until? }
 * @returns true if history was deepened or already sufficient, otherwise false
 */
export async function expandGitHistory(
  cwd: string,
  options: ExpandGitHistoryOptions = {}
): Promise<boolean> {
  if (!(await isGitShallowRepository(cwd))) {
    return false
  }

  return withShallowLock(cwd, async () => {
    const { until } = options
    let { from } = options
    let { pageSize = 50 } = options

    // If an `until` boundary is provided, try a single fetch using the target commit's date
    if (until) {
      if (await isGitAncestor(cwd, until, 'HEAD')) {
        return true
      }

      const commitDate = (
        await execGit(cwd, ['show', '-s', '--format=%cI', `${until}^{commit}`])
      ).trim()

      try {
        await execGit(cwd, [
          '-c',
          'fetch.negotiationAlgorithm=skipping',
          'fetch',
          `--shallow-since=${commitDate}`,
          '--update-shallow',
          '--filter=blob:none',
        ])

        return true
      } catch {}
    }

    // Incremental deepening: account for existing local depth when `from` is set
    if (from) {
      from = await resolveGitRevision(cwd, from)

      const depth = await countGitHistory(cwd, from)

      if (depth > pageSize) {
        return true
      }

      // Reduce requested deepen amount by existing depth (exclude the `from` commit)
      pageSize -= depth - 1
    }

    // Perform a deepen fetch; if `from` is not an ancestor of HEAD, fetch that ref
    try {
      await execGit(cwd, [
        '-c',
        'fetch.negotiationAlgorithm=skipping',
        'fetch',
        `--deepen=${pageSize}`,
        '--update-shallow',
        '--filter=blob:none',
        ...(from && !(await isGitAncestor(cwd, from, 'HEAD'))
          ? ['origin', from, 'HEAD']
          : []),
      ])

      return true
    } catch {
      return false
    }
  })
}
