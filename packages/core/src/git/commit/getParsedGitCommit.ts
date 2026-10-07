// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { TTLCache } from '#cache'
import type { GitCommit } from '#types'
import { execGit } from '#util'
import { parseGitCommit } from './parseGitCommit'
import { GIT_PRETTY_FORMAT, parseGitPrettyFormat } from './parseGitPrettyFormat'

const cache = new TTLCache<string, GitCommit>()

/**
 * Retrieve and parse a git commit by its reference.
 *
 * Fetches the raw git log entry for the specified `ref`, checking the local cache
 * prior to parsing missing entries.
 *
 * @param cwd Current working directory path
 * @param ref Git reference to fetch
 * @param markers Optional array of custom trailer marker strings
 * @returns Structured commit object
 */
export async function getParsedGitCommit(
  cwd: string,
  ref: string,
  markers: readonly string[] = []
): Promise<GitCommit> {
  const stdout = await execGit(cwd, [
    'log',
    '-1',
    ref,
    '--name-only',
    `--pretty=format:${GIT_PRETTY_FORMAT}`,
  ])

  const entry = parseGitPrettyFormat(stdout)

  const key = `${entry.hash}:${entry.parent}:${markers}`

  const cached = cache.get(key)

  if (cached) return cached

  const parsed = await parseGitCommit(entry, markers)

  cache.set(key, parsed)

  return parsed
}
