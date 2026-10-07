// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

/**
 * Normalize an unknown thrown value for logging or display.
 *
 * - If `err` is an `Error`, returns its `message` string.
 * - Otherwise returns the original `err` value unchanged (may be a string,
 *   object, number, `null`, or `undefined`).
 *
 * This function intentionally does not coerce non-Error values to strings so
 * callers can decide how to render structured values.
 *
 * @param err The thrown value to normalize
 * @returns The error message when `err` is an `Error`, otherwise the original value
 */
export function formatError<T>(err: T): T | string {
  if (Error.isError(err)) return err.message
  if (typeof err === 'string') return err
  return err
}
