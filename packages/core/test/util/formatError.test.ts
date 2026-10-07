// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { formatError } from '@reelout/core'
import { expect, test } from 'vitest'

test('formats Error to message', () => {
  expect(formatError(new Error('oops'))).toBe('oops')
})

test('returns string unchanged', () => {
  expect(formatError('hello')).toBe('hello')
})

test('returns unknown unchanged', () => {
  expect(formatError(123)).toBe(123)
  expect(formatError({ a: 1 })).toEqual({ a: 1 })
})

test('returns null and undefined unchanged', () => {
  expect(formatError(null)).toBe(null)
  expect(formatError(undefined)).toBe(undefined)
})
