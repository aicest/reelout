// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { showParsedGitHistory, type ShowGitHistoryOptions } from '#git'
import type { GitCommit } from '#types'
import {
  isReleaseCommit,
  type ReleaseMarker,
} from '../committing/isReleaseCommit'

export interface SliceUnreleasedOptions extends ShowGitHistoryOptions {
  marker?: ReleaseMarker | undefined
}

/**
 * Yield parsed commits from the workspace until a release commit is found.
 *
 * Iterates through parsed commit history and yields unreleased commits in
 * order. Stops processing upon reaching the first release commit.
 *
 * @param cwd Path to the working directory
 * @param options Options for configuring Git history retrieval
 * @yields Parsed `Commit` objects up to the most recent release commit
 */
export async function* sliceUnreleased(
  cwd: string,
  options?: SliceUnreleasedOptions
): AsyncGenerator<GitCommit> {
  for await (const commit of showParsedGitHistory(cwd, options)) {
    if (await isReleaseCommit(cwd, commit, options?.marker)) {
      break
    }

    yield commit
  }
}
