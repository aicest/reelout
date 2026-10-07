// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { isDefined } from './isDefined'

/**
 * Remove `null` and `undefined` values from an array.
 *
 * @param array The array to compact
 * @returns A new array that does not contain `null` or `undefined` values
 */
export function compact<T>(array: readonly (T | null | undefined)[]): T[] {
  return array.filter(isDefined)
}
