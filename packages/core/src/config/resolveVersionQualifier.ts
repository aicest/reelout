// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { ResolvedReleaseRule } from '#types'
import { interpolate } from '#util'
import { isSemVer } from './isSemVer'

export interface ResolveVersionQualifierOptions {
  rule: ResolvedReleaseRule | undefined
  templateParams: Record<string, unknown>
  qualifier: boolean | string | undefined
}

/**
 * Resolve the version qualifier for a release context.
 *
 * Uses the release rule when `qualifier` is `boolean` or omitted. Interpolates
 * `templateParams` into `qualifier` and validates that the result forms a
 * valid SemVer prerelease identifier.
 *
 * @param options Options for resolving the version qualifier
 * @returns Resolved version qualifier string or `undefined`
 * @throws If the resolved string is not a valid SemVer prerelease identifier
 */
export function resolveVersionQualifier(
  options: ResolveVersionQualifierOptions
): string | undefined {
  const { rule, templateParams } = options
  let { qualifier } = options
  let resolved: string | undefined

  if (qualifier === true || qualifier == null) {
    qualifier = rule?.versionQualifier ?? qualifier
  }

  if (typeof qualifier === 'string') {
    resolved = qualifier
  } else if (qualifier) {
    resolved = ''
  }

  if (typeof resolved === 'string') {
    resolved = interpolate(resolved, templateParams)
  }

  if (resolved && !isSemVer(`1.0.0-${resolved}.1`)) {
    throw new Error(
      `The resolved version qualifier "${resolved}" is not a valid SemVer prerelease identifier.`
    )
  }

  return resolved
}
