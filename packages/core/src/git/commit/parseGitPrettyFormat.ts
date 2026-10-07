// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { colors } from 'consola/utils'
import type { GitLogEntry } from './parseGitCommit'

/**
 * Field separator used in the git pretty format to produce a single-line
 *, machine-parseable record.
 */
export const GIT_PRETTY_FIELD_SEPARATOR = '\x1f'

/**
 * Pretty format string passed to `git log --pretty=format:`. Produces seven
 * fields separated by `GIT_PRETTY_FIELD_SEPARATOR`:
 * hash, parents, author date, committer date, subject, body, files.
 */
export const GIT_PRETTY_FORMAT = [
  '%H',
  '%P',
  '%aI',
  '%cI',
  '%s',
  '%b',
  '',
].join(GIT_PRETTY_FIELD_SEPARATOR)

/**
 * Parse a single line produced by `git log --pretty=format:${GIT_PRETTY_FORMAT}`.
 *
 * The input is expected to contain seven fields separated by
 * `GIT_PRETTY_FIELD_SEPARATOR`:
 * 1. `hash` (commit hash)
 * 2. `parent` (space-separated parent hashes)
 * 3. `authorDate` (ISO 8601)
 * 4. `committerDate` (ISO 8601)
 * 5. `subject`
 * 6. `body`
 * 7. `files` (newline-separated list)
 *
 * The function trims fields, converts parent hashes into an array, normalizes
 * dates to ISO strings, and splits `files` into an array. Missing optional
 * fields are normalized to sensible defaults.
 *
 * @param raw Raw pretty-format string produced by git
 * @returns Parsed `GitLogEntry` with `hash`, `parent`, `authorDate`, `committerDate`, `subject`, `body`, and `files`
 * @throws If required fields (hash, authorDate, committerDate, subject) are missing or malformed
 */
export function parseGitPrettyFormat(raw: string): GitLogEntry {
  let [hash, parentHashes, authorDate, committerDate, subject, body, files] =
    raw.split(GIT_PRETTY_FIELD_SEPARATOR)

  hash = hash?.trim()
  parentHashes = parentHashes?.trim()
  authorDate = authorDate?.trim()
  committerDate = committerDate?.trim()
  subject = subject?.trim()
  body = body?.trim()
  files = files?.trim()

  if (!hash || !authorDate || !committerDate || typeof subject !== 'string') {
    throw new Error(
      `The input "${colors.bold(raw)}" is not in the expected pretty format.`
    )
  }

  return {
    hash,
    parent: parentHashes ? parentHashes.split(/\s+/) : [],
    authorDate: new Date(authorDate).toISOString(),
    committerDate: new Date(committerDate).toISOString(),
    subject,
    body: body ?? '',
    files: files ? files.split('\n') : [],
  }
}
