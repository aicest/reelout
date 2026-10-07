// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { normalizeRegistry } from '@reelout/npm'
import { expect, test } from 'vitest'

test('returns undefined for null, undefined, or empty string', () => {
  expect(normalizeRegistry(null)).toBeUndefined()
  expect(normalizeRegistry(undefined)).toBeUndefined()
  expect(normalizeRegistry('')).toBeUndefined()
})

test('normalizes a valid URL string to its href representation', () => {
  expect(normalizeRegistry('https://registry.npmjs.org')).toBe(
    'https://registry.npmjs.org/'
  )
  expect(normalizeRegistry('http://localhost:4873/path')).toBe(
    'http://localhost:4873/path'
  )
})

test('returns undefined for invalid URL strings', () => {
  expect(normalizeRegistry('not-a-valid-url')).toBeUndefined()
  expect(normalizeRegistry('://missing-scheme')).toBeUndefined()
})
