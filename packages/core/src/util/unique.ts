// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

/**
 * Return a new array containing only the first-seen occurrence of each item.
 *
 * This preserves the original iteration order and performs equality checks
 * using JavaScript's `Set` semantics (i.e., primitives by value, objects by
 * reference). The input array is not mutated.
 *
 * @param array The array of items to deduplicate
 * @returns A new array with duplicates removed, preserving first-seen order
 */
export function unique<T>(array: readonly T[]): T[] {
  const seen = new Set<T>()
  const result: T[] = []

  for (const item of array) {
    if (!seen.has(item)) {
      seen.add(item)
      result.push(item)
    }
  }

  return result
}
