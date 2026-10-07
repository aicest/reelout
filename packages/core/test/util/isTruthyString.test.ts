// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { isTruthyString } from '@reelout/core'
import { expect, test } from 'vitest'

test('returns false when input is undefined or empty string', () => {
  expect(isTruthyString(undefined)).toBe(false)
  expect(isTruthyString('')).toBe(false)
})

test('returns true when input is exact string true or 1', () => {
  expect(isTruthyString('true')).toBe(true)
  expect(isTruthyString('1')).toBe(true)
})

test('returns true when input contains uppercase or mixed-case true', () => {
  expect(isTruthyString('TRUE')).toBe(true)
  expect(isTruthyString('True')).toBe(true)
  expect(isTruthyString('TrUe')).toBe(true)
})

test('returns true when target string contains leading or trailing whitespace', () => {
  expect(isTruthyString('  true  ')).toBe(true)
  expect(isTruthyString('\t1\n')).toBe(true)
})

test('returns false when input is unrecognized or falsy string value', () => {
  expect(isTruthyString('false')).toBe(false)
  expect(isTruthyString('0')).toBe(false)
  expect(isTruthyString('yes')).toBe(false)
  expect(isTruthyString('null')).toBe(false)
  expect(isTruthyString('  ')).toBe(false)
})
