// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

/**
 * Determine whether a string value represents a truthy boolean.
 *
 * Trims leading and trailing whitespace and coerces the target string to
 * lowercase. Evaluates the string as truthy if it equals `'true'` or `'1'`.
 *
 * @param value The raw string to evaluate
 * @returns `true` if `value` normalizes to `'true'` or `'1'`, otherwise `false`
 */
export function isTruthyString(value: string | undefined): boolean {
  if (!value) return false

  const normalized = value.toLowerCase().trim()

  return normalized === 'true' || normalized === '1'
}
