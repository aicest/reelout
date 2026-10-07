// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { SEMVER_REGEX } from '#config'
import { compact } from '#util'

const ANCHORED_SEMVER_REGEX = new RegExp(`^${SEMVER_REGEX.source}$`)

const BRACKETED_SEMVER_REGEX = new RegExp(`\\[${SEMVER_REGEX.source}\\]`)

/**
 * Extract SemVer core strings from a line.
 *
 * Splits the line on runs of spaces or tabs and on `..`/`...`. For each token,
 * first attempts an anchored SemVer match (must match the whole token), then
 * a bracketed match that finds a SemVer inside `[...]`. Returns the captured
 * SemVer core (capture group 2) for each successful match; falsy results are
 * filtered out.
 *
 * @param line Line to scan for SemVer cores
 * @returns Array of extracted SemVer core strings; empty if none
 */
export function extractSemVer(line: string): string[] {
  const tokens = line.split(/[ \t]+|\.{2,3}/)

  return compact(
    tokens.map((token) => {
      return (
        ANCHORED_SEMVER_REGEX.exec(token) ?? BRACKETED_SEMVER_REGEX.exec(token)
      )?.at(2)
    })
  )
}
