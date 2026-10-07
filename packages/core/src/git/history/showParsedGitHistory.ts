// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { GitCommit } from '#types'
import { getParsedGitCommit } from '../commit/getParsedGitCommit'
import { showGitHistory, type ShowGitHistoryOptions } from './showGitHistory'

/**
 * Yield parsed commits sequentially from repository history.
 *
 * Fetches commits using `showGitHistory` and parses each commit with
 * `getParsedGitCommit`. Yields successfully parsed `GitCommit` objects on demand
 * and skips unparsable commits.
 *
 * @param cwd Repository working directory path
 * @param options Filter and pagination options passed to `showGitHistory`
 * @yields Parsed `GitCommit` objects in historical order
 */
export async function* showParsedGitHistory(
  cwd: string,
  options?: ShowGitHistoryOptions
): AsyncGenerator<GitCommit> {
  for await (const commit of showGitHistory(cwd, options)) {
    try {
      yield await getParsedGitCommit(cwd, commit)
    } catch {}
  }
}
