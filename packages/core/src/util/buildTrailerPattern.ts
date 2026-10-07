// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

/**
 * Build a regular expression to match trailer lines using custom markers.
 *
 * Combines the provided marker strings with a standard alphanumeric pattern
 * to construct a regular expression that matches trailer definitions.
 *
 * @param markers Optional array of custom trailer marker strings
 * @returns A regular expression matching trailer lines
 */
export function buildTrailerPattern(markers: readonly string[] = []) {
  return new RegExp(
    `^(${markers
      .map(RegExp.escape)
      .concat('[A-Za-z0-9_-]+')
      .join('|')})[ \\t]*:[ \\t]*(.*)$`
  )
}
