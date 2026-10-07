// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { minimatch } from 'minimatch'

/**
 * Determine whether a target string matches glob patterns.
 *
 * Matches positive and negative glob patterns using dotfile support. Automatically
 * expands a single negative pattern by prepending a global wildcard match.
 *
 * @param target Target string to evaluate against glob patterns
 * @param patterns Single glob pattern or list of patterns to evaluate
 * @returns True if target matches positive patterns and satisfies negative patterns
 */
export function isMatch(
  target: string,
  patterns: string | readonly string[]
): boolean {
  if (typeof patterns === 'string') {
    if (patterns.startsWith('!')) {
      patterns = ['**/*', patterns]
    } else {
      patterns = [patterns]
    }
  }

  const positives: string[] = []
  const negatives: string[] = []

  for (const pattern of patterns) {
    if (pattern.startsWith('!')) {
      negatives.push(pattern)
    } else {
      positives.push(pattern)
    }
  }

  return (
    positives.some((pattern) => minimatch(target, pattern, { dot: true })) &&
    negatives.every((pattern) => minimatch(target, pattern, { dot: true }))
  )
}
