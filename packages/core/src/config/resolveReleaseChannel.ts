// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { GitRef, ResolvedReleaseRule } from '#types'
import { interpolate } from '#util'
import { sanitizePrereleaseLabel } from './sanitizePrereleaseLabel'

export interface ResolveReleaseChannelOptions {
  ref: GitRef
  rule: ResolvedReleaseRule | undefined
  templateParams: Record<string, unknown>
  channel: boolean | string | undefined
}

/**
 * Resolve the release channel for a release context.
 *
 * Uses the release rule when `channel` is `boolean` or omitted. Sanitizes the
 * reference name when enabling default channel resolution and interpolates
 * `templateParams` into the result.
 *
 * @param options Options for resolving the release channel
 * @returns Resolved release channel string or `undefined`
 */
export function resolveReleaseChannel(
  options: ResolveReleaseChannelOptions
): string | undefined {
  const { ref, rule, templateParams } = options
  let { channel } = options
  let resolved: string | undefined

  if (channel === true || channel == null) {
    channel = rule?.releaseChannel ?? channel
  }

  if (typeof channel === 'string') {
    resolved = channel
  } else if (channel) {
    resolved = sanitizePrereleaseLabel(ref.name)
  }

  if (typeof resolved === 'string') {
    resolved = interpolate(resolved, templateParams)
  }

  return resolved
}
