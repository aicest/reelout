// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { ReleaseType, VersionTransition } from '#types'
import semver from 'semver'
import { extractVersionQualifier } from './extractVersionQualifier'

export interface BumpVersionOptions {
  version: string
  private?: boolean | undefined
  release: ReleaseType | null | undefined
  identifier?: string | null | undefined
  transition?: VersionTransition | null | undefined
}

/**
 * Bump a semantic version string based on release and transition rules.
 *
 * Parses the target version and determines the next version string using the
 * specified release type, prerelease identifier, and transition mode. Adjusts
 * prerelease types when continuing an existing qualifier and returns `null` when
 * `options.release` is omitted or if transition conditions fail.
 *
 * @param options Version bump configuration including release type, identifier, and transition rules
 * @returns The bumped semantic version string, or `null` if no bump occurs
 * @throws If `options.version` is not a valid semantic version
 */
export function bumpVersion(options: BumpVersionOptions): string | null {
  const { version } = options

  const parsed = semver.parse(version)

  if (!parsed) {
    throw new Error(`Version "${version}" is not a valid semantic version.`)
  }

  if (!options.release) {
    return null
  }

  if (parsed.prerelease.length > 0) {
    if (options.transition === 'advance' && options.identifier == null) {
      return null
    }
  } else {
    if (options.transition === 'continue') {
      return null
    }
  }

  let release: semver.ReleaseType = options.release
  let identifier: string | undefined

  if (typeof options.identifier === 'string') {
    release = `pre${options.release}` as const
    identifier = options.identifier

    const parsedIdentifier = extractVersionQualifier(parsed)

    const transition =
      options.transition ??
      (parsedIdentifier && identifier === '' ? 'advance' : 'continue')

    if (typeof parsedIdentifier === 'string' && transition === 'continue') {
      if (
        (release === 'premajor' && parsed.minor === 0 && parsed.patch === 0) ||
        (release === 'preminor' && parsed.patch === 0) ||
        release === 'prepatch'
      ) {
        release = 'prerelease'
      }
    }
  }

  return semver.inc(parsed, release, { loose: false }, identifier, '0')
}
