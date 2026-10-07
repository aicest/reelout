// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { ReleaseRule, ResolvedReleaseRule } from '#types'
import { sanitizePrereleaseLabel } from './sanitizePrereleaseLabel'

/**
 * Normalize a release rule input into a resolved release rule object.
 *
 * Converts `string` shorthand inputs into structured rule objects with sanitized
 * labels. Resolves `versionQualifier` and `releaseChannel` against `pattern`.
 * Returns `null` if `rule` is invalid, falsy, or missing `pattern`.
 *
 * @param rule Raw release rule input, `string` shorthand, or falsy value
 * @returns Resolved `ResolvedReleaseRule` object, or `null` if `rule` is invalid
 */
export function normalizeReleaseRule(
  rule: ReleaseRule | string | false | null | undefined
): ResolvedReleaseRule | null {
  if (typeof rule === 'string') {
    rule = {
      pattern: rule,
      qualifier: sanitizePrereleaseLabel(rule),
      channel: sanitizePrereleaseLabel(rule),
    }
  }

  if (typeof rule !== 'object' || rule == null) {
    return null
  }

  const { pattern } = rule

  if (pattern == null) {
    return null
  }

  return {
    type: rule.type,
    pattern,
    versionQualifier: resolveRuleValue(rule.qualifier, pattern),
    releaseChannel: resolveRuleValue(rule.channel, pattern),
  }
}

/**
 * Resolve a rule property value from an explicit `string` or pattern fallback.
 *
 * @param value Explicit `string` value, `boolean` flag, or `undefined`
 * @param pattern Fallback pattern string used when `value` is `true`
 * @returns Resolved `string` value or `undefined`
 */
function resolveRuleValue(
  value: string | boolean | undefined,
  pattern: string
): string | undefined {
  if (typeof value === 'string') {
    return value
  }

  if (value) {
    return sanitizePrereleaseLabel(pattern)
  }

  return undefined
}
