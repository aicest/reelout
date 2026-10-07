// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

/**
 * Type guard that asserts a value is neither `null` nor `undefined`.
 *
 * @param value Value to test
 * @returns `true` when `value` is not `null` or `undefined`
 */
export function isDefined<T>(value: T): value is NonNullable<T> {
  return value != null
}
