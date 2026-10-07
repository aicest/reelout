// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { GIT_TRAILER_RELEASE_AGENT } from '#config'
import { getParsedGitCommit } from '#git'
import type { GitCommit, GitCommitTrailer } from '#types'
import { execGit } from '#util'

export type ReleaseMarker = string | ((trailer: GitCommitTrailer) => boolean)

/**
 * Determine whether a commit represents a release or matches a release marker.
 *
 * Resolves string commit identifiers to parsed commit objects, checks if any
 * associated trailer matches the `marker` predicate, and falls back to
 * verifying exact tag matches for the `commit` hash.
 *
 * @param cwd Working directory path for Git commands
 * @param commit Commit object, hash string, or nullish value
 * @param marker Trailer key string or predicate function to evaluate
 * @returns `true` if the commit is a release commit, otherwise `false`
 */
export async function isReleaseCommit(
  cwd: string,
  commit: GitCommit | string | null | undefined,
  marker: ReleaseMarker = GIT_TRAILER_RELEASE_AGENT
): Promise<boolean> {
  if (typeof commit === 'string') {
    try {
      commit = await getParsedGitCommit(
        cwd,
        commit,
        typeof marker === 'string' ? [marker] : []
      )
    } catch {
      commit = null
    }
  }

  if (!commit) {
    return false
  }

  const predicate =
    typeof marker === 'string'
      ? (trailer: GitCommitTrailer) => trailer.key === marker && !!trailer.value
      : marker

  if (commit.trailers.some(predicate)) {
    return true
  }

  return execGit(cwd, ['describe', '--tags', '--exact-match', commit.hash])
    .then(() => true)
    .catch(() => false)
}
