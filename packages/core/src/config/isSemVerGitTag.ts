// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { SEMVER_REGEX } from './const'

/**
 * Determine whether a tag string is a valid SemVer-style Git tag.
 *
 * Anchors `SEMVER_REGEX.source` for full-string matching and applies the
 * repository's Git-tag acceptance rules.
 *
 * @param tag Tag string to validate
 * @returns `true` if `tag` is accepted as a SemVer-style Git tag; otherwise `false`
 */
export function isSemVerGitTag(tag: string): boolean {
  const match = new RegExp(`^${SEMVER_REGEX.source}$`).exec(tag)

  if (!match) return false

  const isScopedPackage = Boolean(match[1])

  const hasVersionPrefix = tag.startsWith('v')

  return isScopedPackage || hasVersionPrefix
}
