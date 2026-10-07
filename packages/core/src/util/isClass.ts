// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

/**
 * Determine whether a given value is a constructible class.
 *
 * Verifies that the input is a function with a non-writable prototype, can
 * be successfully invoked via `Reflect.construct`, and matches ES6 class
 * syntax.
 *
 * @param func The unknown value to inspect
 * @returns True if the value is a class, false otherwise
 */
export function isClass(
  func: unknown
): func is new (...args: readonly unknown[]) => unknown {
  if (typeof func !== 'function') {
    return false
  }

  try {
    Reflect.construct(Object, [], func)
  } catch {
    return false
  }

  const descriptor = Object.getOwnPropertyDescriptor(func, 'prototype')

  if (!descriptor || descriptor.writable) {
    return false
  }

  return /^class\s/.test(Function.prototype.toString.call(func))
}
